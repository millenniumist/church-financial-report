#!/bin/bash

# Local self-host deployment script
# - Syncs latest code from development directory
# - Rebuilds the Next.js Docker image
# - Restarts the application container
# - Restarts the Cloudflare tunnel on this machine

set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load global configuration
CONFIG_FILE="$LOCAL_DIR/config.sh"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "⚠️  Warning: config.sh not found. Using defaults."
  echo "   Copy config.example.sh to config.sh and customize for your environment."
  echo ""
fi
# Source config if it exists (ignore errors if not)
# shellcheck disable=SC1090
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE" || true

# Configuration (with environment variable overrides)
# In monorepo: app source is at parent directory (root of repo)
APP_DIR="$(dirname "$LOCAL_DIR")"
COMPOSE_FILE="$LOCAL_DIR/docker-compose.selfhost.yml"
CLOUDFLARE_DIR="$LOCAL_DIR/cloudflare"
CLOUDFLARE_TUNNEL_NAME="${CLOUDFLARE_TUNNEL_NAME:-millenniumist}"
CLOUDFLARED_LOG="$LOCAL_DIR/cloudflared.log"
CONTAINER_NAME="${CONTAINER_NAME:-nextjs-app}"
APP_PORT="${APP_PORT:-8358}"
DEV_ENV_FILE="${DEV_ENV_FILE:-.env}"
DOMAIN="${DOMAIN:-millenniumist.dpdns.org}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}$1${NC}"; }
warn()    { echo -e "${YELLOW}$1${NC}"; }
success() { echo -e "${GREEN}$1${NC}"; }
error()   { echo -e "${RED}$1${NC}" >&2; exit 1; }

ensure_command() {
  local cmd="$1"
  local friendly="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    error "✗ ${friendly} not found. Please install it before deploying."
  fi
}

load_env_file() {
  local file="$1"
  if [ -f "$file" ]; then
    info "Loading environment variables from ${file}"
    # shellcheck disable=SC1090
    set -a
    source "$file"
    set +a
  fi
}

ensure_command rsync "rsync"
ensure_command docker "Docker"
ensure_command cloudflared "cloudflared CLI"

# Prefer Docker Compose V2, fall back to V1 if needed
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  error "✗ Docker Compose not found. Install Docker Compose (v2 recommended)."
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Self-Hosted Deployment (Local)${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Step 1: Prepare production environment file
echo -e "${YELLOW}[1/6] Preparing production environment...${NC}"
if [ ! -d "$APP_DIR" ]; then
  error "✗ App directory not found at ${APP_DIR}. Make sure you're running from the monorepo."
fi

# Copy .env to .env.production if it doesn't exist
if [ -f "$APP_DIR/.env" ] && [ ! -f "$APP_DIR/.env.production" ]; then
  cp "$APP_DIR/.env" "$APP_DIR/.env.production"
  info "Copied .env to .env.production"
fi

# Normalize GOOGLE_SERVICE_ACCOUNT_PATH for Docker container
if [ -f "$APP_DIR/.env.production" ]; then
  python3 - "$APP_DIR/.env.production" <<'PY' || error "✗ Failed to normalize GOOGLE_SERVICE_ACCOUNT_PATH"
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
content = env_path.read_text().splitlines()
target = "GOOGLE_SERVICE_ACCOUNT_PATH=/app/privatekey-gsheet.json"
found = False

for idx, line in enumerate(content):
    if line.startswith("GOOGLE_SERVICE_ACCOUNT_PATH="):
        content[idx] = target
        found = True
        break

if not found:
    content.append(target)

env_path.write_text("\n".join(content) + "\n")
PY
  info "Normalized GOOGLE_SERVICE_ACCOUNT_PATH for container build"
fi
success "✓ Environment prepared"
echo ""

# Step 2: Ensure deployment artifacts exist
echo -e "${YELLOW}[2/6] Verifying deployment files...${NC}"
[ -f "$APP_DIR/Dockerfile" ] || error "✗ Missing ${APP_DIR}/Dockerfile"
[ -f "$COMPOSE_FILE" ] || error "✗ Missing ${COMPOSE_FILE}"
if [ ! -f "$APP_DIR/privatekey-gsheet.json" ]; then
  warn "⚠️  ${APP_DIR}/privatekey-gsheet.json not found. Google Sheets access will fail."
fi
success "✓ Deployment files present"
echo ""

# Step 3: Load environment variables
echo -e "${YELLOW}[3/6] Loading environment...${NC}"
PRIMARY_ENV_FILE="$APP_DIR/.env.production"
load_env_file "$PRIMARY_ENV_FILE"

: "${GOOGLE_SHEETS_SPREADSHEET_ID:?GOOGLE_SHEETS_SPREADSHEET_ID must be set (define it in ${PRIMARY_ENV_FILE})}"
success "✓ Environment ready"
echo ""

# Step 4: Rebuild and start Docker container
echo -e "${YELLOW}[4/6] Building and restarting nextjs-app container...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q '^nextjs-app$'; then
  info "Stopping existing nextjs-app container..."
  docker stop nextjs-app >/dev/null 2>&1 || true
  docker rm nextjs-app >/dev/null 2>&1 || true
fi

# Build from monorepo root (parent directory)
pushd "$(dirname "$LOCAL_DIR")" >/dev/null
$DOCKER_COMPOSE_CMD -f "$COMPOSE_FILE" up -d --build nextjs-app
popd >/dev/null
success "✓ nextjs-app container rebuilt and running"
echo ""

# Step 5: Health check
echo -e "${YELLOW}[5/6] Running health checks...${NC}"
sleep 5
if curl -fsS --max-time 5 "http://localhost:${APP_PORT}" >/dev/null 2>&1; then
  success "✓ Next.js app responding on http://localhost:${APP_PORT}"
else
  warn "⚠️  Unable to reach http://localhost:${APP_PORT}. Check container logs: docker logs nextjs-app"
fi
echo ""

# Step 6: Restart Cloudflare tunnel
echo -e "${YELLOW}[6/6] Restarting Cloudflare tunnel (${CLOUDFLARE_TUNNEL_NAME})...${NC}"
CONFIG_FILE="$CLOUDFLARE_DIR/config.yml"
# Auto-detect credentials file in cloudflare directory
CREDENTIAL_FILE=$(find "$CLOUDFLARE_DIR" -name "*.json" -type f | head -n 1)
[ -f "$CONFIG_FILE" ] || error "✗ Cloudflare config not found at ${CONFIG_FILE}. Copy config.example.yml to config.yml and configure it."
[ -f "$CREDENTIAL_FILE" ] || error "✗ Cloudflare tunnel credentials missing in ${CLOUDFLARE_DIR}. Run 'cloudflared tunnel login' and copy credentials."

if pgrep cloudflared >/dev/null 2>&1; then
  info "Stopping existing cloudflared process..."
  pkill cloudflared || true
  sleep 2
fi

nohup cloudflared tunnel --config "$CONFIG_FILE" run "$CLOUDFLARE_TUNNEL_NAME" > "$CLOUDFLARED_LOG" 2>&1 &
sleep 8

if pgrep cloudflared >/dev/null 2>&1; then
  success "✓ Cloudflare tunnel running"
  if grep -i "error" "$CLOUDFLARED_LOG" >/dev/null 2>&1; then
    warn "⚠️  Detected errors in cloudflared logs:"
    tail -n 5 "$CLOUDFLARED_LOG" || true
  else
    info "Logs: tail -f $CLOUDFLARED_LOG"
  fi
else
  error "✗ Failed to start cloudflared tunnel. See logs at $CLOUDFLARED_LOG"
fi
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment Complete${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "App URL: https://$DOMAIN"
echo "Local:  http://localhost:$APP_PORT"
echo ""
echo "Next steps:"
echo "  - docker logs $CONTAINER_NAME              # Application logs"
echo "  - tail -f $CLOUDFLARED_LOG                 # Tunnel logs"
echo ""
