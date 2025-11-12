#!/bin/bash

# Remote self-host deployment script
# - Syncs latest code from development directory to remote host
# - Transfers deployment files to Raspberry Pi
# - Rebuilds the Next.js Docker image on remote host
# - Restarts the application container on remote host
# - Restarts the Cloudflare tunnel on remote host

set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load environment file for remote host configuration
ENV_FILE="$LOCAL_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  Error: .env file not found at $ENV_FILE"
  echo "   Create .env with: hostIp, username, password"
  exit 1
fi

# Load remote host configuration (handle spaces around =)
while IFS= read -r line || [ -n "$line" ]; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Parse key=value with optional spaces and quotes
  if [[ "$line" =~ ^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=[[:space:]]*(.+)[[:space:]]*$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    # Remove surrounding quotes if present
    value="${value%\"}"
    value="${value#\"}"
    # Export the variable
    export "$key=$value"
  fi
done < "$ENV_FILE"

# Validate required environment variables
: "${hostIp:?hostIp must be set in .env}"
: "${username:?username must be set in .env}"

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
CLOUDFLARED_LOG="cloudflared.log"
CONTAINER_NAME="${CONTAINER_NAME:-nextjs-app}"
APP_PORT="${APP_PORT:-8358}"
DEV_ENV_FILE="${DEV_ENV_FILE:-.env}"
DOMAIN="${DOMAIN:-millenniumist.dpdns.org}"
SSH_DOMAIN="${SSH_DOMAIN:-ssh.millenniumist.dpdns.org}"

# Remote paths
REMOTE_HOME="/home/$username"
REMOTE_DEPLOY_DIR="$REMOTE_HOME/hosting"
REMOTE_APP_DIR="$REMOTE_DEPLOY_DIR/app"
REMOTE_CLOUDFLARE_DIR="$REMOTE_DEPLOY_DIR/cloudflare"

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

# Detect network connection method
echo ""
echo -e "${BLUE}Detecting connection method...${NC}"
USE_TUNNEL="false"

# Try to connect to local IP on port 22 (SSH)
if nc -z -w 2 "$hostIp" 22 2>/dev/null; then
  CONNECTION_METHOD="Local Network"
  TARGET_HOST="$hostIp"
  info "✓ Local network detected - using direct connection to $hostIp"
else
  CONNECTION_METHOD="Cloudflare Tunnel"
  TARGET_HOST="$SSH_DOMAIN"
  USE_TUNNEL="true"
  info "✓ External network detected - using Cloudflare tunnel via $SSH_DOMAIN"
fi

# Check local requirements
ensure_command rsync "rsync"
ensure_command ssh "SSH"

# Check for connection-specific requirements
if [ "$USE_TUNNEL" = "true" ]; then
  ensure_command cloudflared "cloudflared (install with: brew install cloudflared)"
else
  ensure_command sshpass "sshpass"
fi

# SSH command wrapper - works with both local and tunnel connections
ssh_cmd() {
  if [ "$USE_TUNNEL" = "true" ]; then
    # Use Cloudflare tunnel (no password needed, uses ProxyCommand)
    ssh -o ProxyCommand="cloudflared access ssh --hostname $SSH_DOMAIN" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PubkeyAuthentication=no \
        -o PasswordAuthentication=yes \
        "$username@$SSH_DOMAIN" "$@"
  else
    # Use local network with password
    sshpass -p "$password" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$username@$hostIp" "$@"
  fi
}

# SCP command wrapper - works with both local and tunnel connections
scp_cmd() {
  if [ "$USE_TUNNEL" = "true" ]; then
    # Use Cloudflare tunnel
    local src="$1"
    local dst="$2"
    scp -o ProxyCommand="cloudflared access ssh --hostname $SSH_DOMAIN" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PubkeyAuthentication=no \
        -o PasswordAuthentication=yes \
        "$src" "$dst"
  else
    # Use local network with password
    sshpass -p "$password" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$@"
  fi
}

# RSYNC command wrapper - works with both local and tunnel connections
rsync_cmd() {
  if [ "$USE_TUNNEL" = "true" ]; then
    # Use Cloudflare tunnel
    rsync -e "ssh -o ProxyCommand='cloudflared access ssh --hostname $SSH_DOMAIN' -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PubkeyAuthentication=no -o PasswordAuthentication=yes" "$@"
  else
    # Use local network with password
    sshpass -p "$password" rsync -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" "$@"
  fi
}

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Self-Hosted Deployment (Remote)${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
info "Connection: $CONNECTION_METHOD"
info "Target host: $username@$TARGET_HOST"
echo ""

# Step 0: Test SSH connectivity
echo -e "${YELLOW}[0/8] Testing SSH connectivity...${NC}"
if ! ssh_cmd "echo 'SSH connection successful'" >/dev/null 2>&1; then
  error "✗ Cannot connect to $username@$TARGET_HOST via $CONNECTION_METHOD. Check network, credentials, and SSH access."
fi
success "✓ SSH connection established via $CONNECTION_METHOD"
echo ""

# Step 1: Prepare production environment file
echo -e "${YELLOW}[1/8] Preparing production environment...${NC}"
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

# Step 2: Verify deployment files locally
echo -e "${YELLOW}[2/8] Verifying local deployment files...${NC}"
[ -f "$APP_DIR/Dockerfile" ] || error "✗ Missing ${APP_DIR}/Dockerfile"
[ -f "$COMPOSE_FILE" ] || error "✗ Missing ${COMPOSE_FILE}"
if [ ! -f "$APP_DIR/privatekey-gsheet.json" ]; then
  warn "⚠️  ${APP_DIR}/privatekey-gsheet.json not found. Google Sheets access will fail."
fi
success "✓ Local deployment files present"
echo ""

# Step 3: Build Docker image locally on Mac M2
echo -e "${YELLOW}[3/9] Building Docker image locally on Mac M2 (ARM64)...${NC}"
IMAGE_NAME="nextjs-app"
IMAGE_TAG="latest"
IMAGE_TAR="nextjs-app-arm64.tar"

info "Building image for ARM64 architecture..."
cd "$APP_DIR"
docker build --platform linux/arm64 -t "${IMAGE_NAME}:${IMAGE_TAG}" -f Dockerfile . || error "✗ Failed to build Docker image"
success "✓ Docker image built: ${IMAGE_NAME}:${IMAGE_TAG}"

info "Saving image to tar file..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" -o "/tmp/${IMAGE_TAR}" || error "✗ Failed to save Docker image"
IMAGE_SIZE=$(du -h "/tmp/${IMAGE_TAR}" | cut -f1)
success "✓ Image saved to /tmp/${IMAGE_TAR} (${IMAGE_SIZE})"
cd "$LOCAL_DIR"
echo ""

# Step 4: Create remote deployment directory
echo -e "${YELLOW}[4/9] Creating remote deployment directory...${NC}"
ssh_cmd "mkdir -p $REMOTE_DEPLOY_DIR $REMOTE_APP_DIR $REMOTE_CLOUDFLARE_DIR" || error "✗ Failed to create remote directories"
success "✓ Remote directories created"
echo ""

# Step 5: Transfer files to remote host
echo -e "${YELLOW}[5/9] Transferring files to remote host...${NC}"

info "Transferring Docker image (${IMAGE_SIZE})..."
scp_cmd "/tmp/${IMAGE_TAR}" "$username@$TARGET_HOST:$REMOTE_DEPLOY_DIR/" || error "✗ Failed to transfer Docker image"

info "Copying docker-compose file..."
scp_cmd "$COMPOSE_FILE" "$username@$TARGET_HOST:$REMOTE_DEPLOY_DIR/" || error "✗ Failed to copy docker-compose file"

info "Syncing cloudflare directory..."
rsync_cmd -av "$CLOUDFLARE_DIR/" "$username@$TARGET_HOST:$REMOTE_CLOUDFLARE_DIR/" || error "✗ Failed to sync cloudflare directory"

info "Syncing environment and config files..."
rsync_cmd -av --delete --exclude="node_modules" --exclude=".next" "$APP_DIR/.env.production" "$username@$TARGET_HOST:$REMOTE_APP_DIR/" || error "✗ Failed to sync environment file"

success "✓ Files transferred to remote host"
echo ""

# Clean up local tar file
rm -f "/tmp/${IMAGE_TAR}"
info "Cleaned up local image file"
echo ""

# Step 6: Check remote requirements and load environment
echo -e "${YELLOW}[6/9] Checking remote environment...${NC}"
ssh_cmd bash <<'REMOTE_CHECK'
set -e

# Check for required commands on remote host
check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ $2 not found on remote host. Please install it."
    exit 1
  fi
}

check_cmd docker "Docker"
check_cmd cloudflared "cloudflared CLI"

# Check for Docker Compose
if docker compose version >/dev/null 2>&1; then
  echo "✓ Docker Compose V2 available"
elif command -v docker-compose >/dev/null 2>&1; then
  echo "✓ Docker Compose V1 available"
else
  echo "✗ Docker Compose not found on remote host"
  exit 1
fi

# Verify environment file
if [ ! -f "$HOME/hosting/app/.env.production" ]; then
  echo "⚠️  Warning: .env.production not found on remote host"
fi

echo "✓ Remote environment ready"
REMOTE_CHECK

success "✓ Remote environment verified"
echo ""

# Step 7: Load Docker image and start container on remote host
echo -e "${YELLOW}[7/9] Loading Docker image and starting container on remote host...${NC}"
ssh_cmd bash <<REMOTE_DEPLOY
set -e

cd $REMOTE_DEPLOY_DIR

# Load Docker image from tar file
echo "Loading Docker image from tar file..."
docker load -i ${IMAGE_TAR} || { echo "✗ Failed to load Docker image"; exit 1; }
echo "✓ Docker image loaded successfully"

# Remove old images to save space
echo "Cleaning up old images..."
docker image prune -f >/dev/null 2>&1 || true

# Remove the tar file to save space
rm -f ${IMAGE_TAR}
echo "✓ Cleaned up tar file"

# Load environment variables from .env.production
if [ -f app/.env.production ]; then
  echo "Loading environment variables from .env.production"
  set -a
  source app/.env.production
  set +a
else
  echo "⚠️  Warning: .env.production not found"
fi

# Stop existing container if running
if docker ps -a --format '{{.Names}}' | grep -q '^nextjs-app$'; then
  echo "Stopping existing nextjs-app container..."
  docker stop nextjs-app >/dev/null 2>&1 || true
  docker rm nextjs-app >/dev/null 2>&1 || true
fi

# Determine Docker Compose command
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

# Start container (without building - image is already loaded)
\$DOCKER_COMPOSE_CMD -f docker-compose.selfhost.yml up -d nextjs-app

echo "✓ Container started from pre-built image"
REMOTE_DEPLOY

success "✓ nextjs-app container running on remote host"
echo ""

# Step 8: Health check
echo -e "${YELLOW}[8/9] Running health checks...${NC}"
sleep 5

# Check if container is running
CONTAINER_STATUS=$(ssh_cmd "docker ps --filter name=nextjs-app --format '{{.Status}}'")
if [ -n "$CONTAINER_STATUS" ]; then
  success "✓ Container status: $CONTAINER_STATUS"
else
  warn "⚠️  Container not running. Check logs: ssh $username@$hostIp 'docker logs nextjs-app'"
fi

# Check if app responds
if ssh_cmd "curl -fsS --max-time 5 http://localhost:${APP_PORT}" >/dev/null 2>&1; then
  success "✓ Next.js app responding on remote host at http://localhost:${APP_PORT}"
else
  warn "⚠️  Unable to reach http://localhost:${APP_PORT} on remote host. Check container logs."
fi
echo ""

# Step 9: Setup and start Cloudflare tunnel with auto-start on remote host
echo -e "${YELLOW}[9/10] Setting up Cloudflare tunnel with auto-start on remote host...${NC}"
ssh_cmd bash <<REMOTE_TUNNEL
set -e

cd $REMOTE_DEPLOY_DIR

CREDENTIAL_FILE=\$(find cloudflare -name "*.json" -type f | head -n 1)
TUNNEL_NAME="$CLOUDFLARE_TUNNEL_NAME"
LOG_FILE="$CLOUDFLARED_LOG"

# Verify credential file exists
if [ ! -f "\$CREDENTIAL_FILE" ]; then
  echo "✗ Cloudflare tunnel credentials missing"
  exit 1
fi

# Get absolute path for credentials
CREDENTIAL_FILE_ABS="\$(cd \$(dirname \$CREDENTIAL_FILE) && pwd)/\$(basename \$CREDENTIAL_FILE)"

# Create config.yml with correct remote paths (including SSH access)
cat > cloudflare/config.yml <<CONFIG
tunnel: 6f35126e-f103-4ad9-906c-de178bac41ef
credentials-file: \$CREDENTIAL_FILE_ABS

ingress:
  - hostname: millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: www.millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: ssh.millenniumist.dpdns.org
    service: ssh://localhost:22
  - service: http_status:404
CONFIG

echo "Created config.yml with credentials path: \$CREDENTIAL_FILE_ABS"

# Find cloudflared binary path
CLOUDFLARED_BIN=\$(which cloudflared)
if [ -z "\$CLOUDFLARED_BIN" ]; then
  echo "✗ cloudflared not found in PATH"
  exit 1
fi

# Create systemd service file
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<SERVICE
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=$username
WorkingDirectory=$REMOTE_DEPLOY_DIR
ExecStart=\$CLOUDFLARED_BIN tunnel --config $REMOTE_DEPLOY_DIR/cloudflare/config.yml run \$TUNNEL_NAME
Restart=always
RestartSec=5
StandardOutput=append:$REMOTE_DEPLOY_DIR/\$LOG_FILE
StandardError=append:$REMOTE_DEPLOY_DIR/\$LOG_FILE

[Install]
WantedBy=multi-user.target
SERVICE

echo "✓ Created systemd service file"

# Stop existing manual tunnel processes
if pgrep cloudflared >/dev/null 2>&1; then
  echo "Stopping existing cloudflared processes..."
  pkill cloudflared || true
  sleep 2
fi

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sleep 5

# Verify tunnel is running
if sudo systemctl is-active --quiet cloudflared; then
  echo "✓ Cloudflare tunnel service is running"
  echo "✓ Auto-start on boot enabled"
  
  # Check logs for errors
  if grep -i "error" "\$LOG_FILE" >/dev/null 2>&1; then
    echo "⚠️  Detected errors in cloudflared logs:"
    tail -n 5 "\$LOG_FILE" || true
  else
    echo "✓ Tunnel connections established successfully"
  fi
else
  echo "✗ Failed to start cloudflared service"
  sudo systemctl status cloudflared --no-pager || true
  exit 1
fi

echo ""
echo "Service management commands:"
echo "  sudo systemctl status cloudflared   # Check status"
echo "  sudo systemctl restart cloudflared  # Restart tunnel"
echo "  sudo systemctl stop cloudflared     # Stop tunnel"
echo "  tail -f $REMOTE_DEPLOY_DIR/\$LOG_FILE  # View logs"
REMOTE_TUNNEL

success "✓ Cloudflare tunnel running with auto-start enabled on remote host"
echo ""

# Step 10: Setup Health Monitor with MQTT (if enabled)
if [ "${ENABLE_HEALTH_MONITOR:-true}" = "true" ] && [ -f "$LOCAL_DIR/health-monitor.js" ]; then
  echo -e "${YELLOW}[10/10] Setting up health monitoring with MQTT...${NC}"

  # Check if Mosquitto is installed
  if ! ssh_cmd "command -v mosquitto" >/dev/null 2>&1; then
    info "Installing Mosquitto MQTT broker..."
    ssh_cmd "sudo apt update && sudo apt install -y mosquitto mosquitto-clients" >/dev/null 2>&1 || warn "⚠️  Failed to install Mosquitto"
  fi

  # Configure Mosquitto if not already configured
  ssh_cmd bash <<SETUP_MQTT
    set -e

    # Check if config exists
    if [ ! -f /etc/mosquitto/conf.d/default.conf ]; then
      echo "Configuring Mosquitto..."
      sudo tee /etc/mosquitto/conf.d/default.conf > /dev/null <<'EOF'
listener 1883 0.0.0.0
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF

      # Create users
      sudo mosquitto_passwd -c -b /etc/mosquitto/passwd ${MQTT_USERNAME:-ccchurch} ${MQTT_PASSWORD:-ccchurch2025}
      sudo mosquitto_passwd -b /etc/mosquitto/passwd ${MQTT_MOBILE_USERNAME:-mobile} ${MQTT_MOBILE_PASSWORD:-mobile2025}

      # Fix permissions
      sudo chown mosquitto:mosquitto /etc/mosquitto/passwd
      sudo chmod 600 /etc/mosquitto/passwd

      # Restart
      sudo systemctl restart mosquitto
      echo "✓ Mosquitto configured"
    fi

    # Ensure Mosquitto is running
    sudo systemctl enable mosquitto >/dev/null 2>&1
    if ! sudo systemctl is-active --quiet mosquitto; then
      sudo systemctl start mosquitto
    fi
SETUP_MQTT

  # Check if Node.js is installed
  if ! ssh_cmd "command -v node" >/dev/null 2>&1; then
    info "Installing Node.js..."
    ssh_cmd "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs" >/dev/null 2>&1 || warn "⚠️  Failed to install Node.js"
  fi

  # Install mqtt package
  ssh_cmd bash <<INSTALL_NPM
    set -e
    cd $REMOTE_DEPLOY_DIR
    if [ ! -f package.json ]; then
      cat > package.json <<'PKG'
{
  "name": "cc-church-monitoring",
  "version": "1.0.0",
  "dependencies": {
    "mqtt": "^5.0.0"
  }
}
PKG
    fi
    npm install >/dev/null 2>&1
INSTALL_NPM

  # Create health-monitor.env from main env
  cat > /tmp/health-monitor.env <<HEALTHENV
APP_URL=${APP_URL:-http://localhost:8358}
CONTAINER_NAME=${CONTAINER_NAME:-nextjs-app}
HEALTH_ENDPOINT=${HEALTH_ENDPOINT:-/api/health}
MQTT_BROKER=${MQTT_BROKER:-mqtt://$hostIp:1883}
MQTT_TOPIC=${MQTT_TOPIC:-homeassistant/sensor/cc-church}
MQTT_CLIENT_ID=${MQTT_CLIENT_ID:-cc-church-health}
MQTT_USERNAME=${MQTT_USERNAME:-ccchurch}
MQTT_PASSWORD=${MQTT_PASSWORD:-ccchurch2025}
CHECK_INTERVAL=${CHECK_INTERVAL:-60000}
HEALTHENV

  # Transfer files
  info "Transferring health monitor files..."
  scp_cmd "$LOCAL_DIR/health-monitor.js" "$username@$TARGET_HOST:$REMOTE_DEPLOY_DIR/"
  scp_cmd "/tmp/health-monitor.env" "$username@$TARGET_HOST:$REMOTE_DEPLOY_DIR/health-monitor.env"
  scp_cmd "$LOCAL_DIR/health-monitor.service" "$username@$TARGET_HOST:/tmp/"
  ssh_cmd "chmod +x $REMOTE_DEPLOY_DIR/health-monitor.js"
  rm -f /tmp/health-monitor.env

  # Install or update systemd service
  ssh_cmd bash <<INSTALL_SERVICE
    set -e

    # Copy service file
    sudo cp /tmp/health-monitor.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable health-monitor.service

    # Restart service
    sudo systemctl restart health-monitor.service

    # Wait and check
    sleep 3
    if sudo systemctl is-active --quiet health-monitor.service; then
      echo "✓ Health monitor is running"
    else
      echo "⚠️  Health monitor may have issues. Check: sudo journalctl -u health-monitor -n 20"
    fi
INSTALL_SERVICE

  success "✓ Health monitoring with MQTT enabled"
  echo ""
fi

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Remote Deployment Complete${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "App URL:    https://$DOMAIN"
echo "Remote:     http://$hostIp:$APP_PORT"
echo ""
echo "Services:"
echo "  - ssh $username@$hostIp 'docker logs $CONTAINER_NAME'    # Application logs"
echo "  - ssh $username@$hostIp 'tail -f $REMOTE_DEPLOY_DIR/$CLOUDFLARED_LOG'    # Tunnel logs"
echo "  - ssh $username@$hostIp 'docker ps'                       # Container status"
echo ""

if [ "${ENABLE_HEALTH_MONITOR:-true}" = "true" ]; then
  echo "Health Monitoring:"
  echo "  - ssh $username@$hostIp 'sudo systemctl status health-monitor'    # Service status"
  echo "  - ssh $username@$hostIp 'tail -f $REMOTE_DEPLOY_DIR/health-monitor.log'    # Monitor logs"
  echo ""
  echo "MQTT Dashboard (Android):"
  echo "  Broker: mqtt://$hostIp:1883"
  echo "  Username: ${MQTT_MOBILE_USERNAME:-mobile}"
  echo "  Password: ${MQTT_MOBILE_PASSWORD:-mobile2025}"
  echo "  Topic: ${MQTT_TOPIC:-homeassistant/sensor/cc-church}/#"
  echo ""
fi
