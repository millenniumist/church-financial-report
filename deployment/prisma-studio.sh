#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
CONFIG_FILE="$SCRIPT_DIR/config.sh"

PRISMA_PORT="${PRISMA_PORT:-5555}"
LOCAL_PORT="${LOCAL_PORT:-$PRISMA_PORT}"
CONTAINER_NAME_DEFAULT="nextjs-app"
FORWARDER_NAME="prisma-studio-forwarder"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  -p, --port <number>        Port Prisma Studio listens on inside the container (default: ${PRISMA_PORT})
  -l, --local-port <number>  Local port to forward to Prisma Studio (default: same as --port)
  -c, --container <name>     Docker container name (default: nextjs-app or CONTAINER_NAME from config.sh)
  -h, --help                 Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      PRISMA_PORT="$2"
      shift 2
      ;;
    -l|--local-port)
      LOCAL_PORT="$2"
      shift 2
      ;;
    -c|--container)
      CONTAINER_NAME_DEFAULT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ Missing deployment/.env. Configure hostIp/username/password first."
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^[[:space:]]*([a-zA-Z_][a-zA-Z0-9_]*)[[:space:]]*=[[:space:]]*(.+)[[:space:]]*$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  fi
done < "$ENV_FILE"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

: "${hostIp:?hostIp missing in deployment/.env}"
: "${username:?username missing in deployment/.env}"
: "${password:?password missing in deployment/.env}"

CONTAINER_NAME="${CONTAINER_NAME:-$CONTAINER_NAME_DEFAULT}"
SSH_DOMAIN="${SSH_DOMAIN:-ssh.millenniumist.dpdns.org}"

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ Required command '$1' not found. $2"
    exit 1
  fi
}

ensure_command ssh ""
ensure_command nc "Install netcat (nc)."

USE_TUNNEL="false"
TARGET_HOST="$hostIp"

if nc -z -w 2 "$hostIp" 22 >/dev/null 2>&1; then
  echo "✓ Using direct LAN connection to $hostIp"
  ensure_command sshpass "Install sshpass (e.g. brew install hudochenkov/sshpass/sshpass)."
else
  USE_TUNNEL="true"
  TARGET_HOST="$SSH_DOMAIN"
  echo "✓ Falling back to Cloudflare tunnel ($SSH_DOMAIN)"
  ensure_command cloudflared "Install Cloudflared (brew install cloudflare/cloudflared/cloudflared)."
fi

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$LOCAL_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✗ Local port $LOCAL_PORT is already in use. Pick another with --local-port."
    exit 1
  fi
else
  echo "⚠️  lsof not available, skipping local port availability check."
fi

ssh_cmd() {
  if [ "$USE_TUNNEL" = "true" ]; then
    ssh -o ProxyCommand="cloudflared access ssh --hostname $SSH_DOMAIN" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PubkeyAuthentication=no \
        -o PasswordAuthentication=yes \
        "$username@$SSH_DOMAIN" "$@"
  else
    sshpass -p "$password" ssh \
      -o StrictHostKeyChecking=no \
      -o UserKnownHostsFile=/dev/null \
      "$username@$hostIp" "$@"
  fi
}

echo "Checking that Docker container '$CONTAINER_NAME' is running..."
if ! ssh_cmd "docker ps --format '{{.Names}}' | grep -qw '$CONTAINER_NAME'"; then
  echo "✗ Container '$CONTAINER_NAME' is not running on the remote host."
  exit 1
fi

echo ""
echo "Local tunnel : http://localhost:${LOCAL_PORT}"
echo "Remote port  : ${PRISMA_PORT}"
echo "Container    : ${CONTAINER_NAME}"
echo "Press Ctrl+C when you are done – this stops Prisma Studio and the forwarder."
echo ""

REMOTE_SCRIPT=$(cat <<EOF
set -euo pipefail
CONTAINER_NAME="$CONTAINER_NAME"
PRISMA_PORT="$PRISMA_PORT"
FORWARDER_NAME="$FORWARDER_NAME"
FORWARDER_ID=""

cleanup() {
  if [ -n "\${FORWARDER_ID:-}" ]; then
    docker stop "\$FORWARDER_ID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

CONTAINER_IP=\$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "\$CONTAINER_NAME")
if [ -z "\$CONTAINER_IP" ]; then
  echo "✗ Unable to determine container IP for \$CONTAINER_NAME."
  exit 1
fi

echo "→ Container IP: \$CONTAINER_IP"
echo "→ Spinning up forwarder container (\$FORWARDER_NAME) on port \$PRISMA_PORT..."
docker rm -f "\$FORWARDER_NAME" >/dev/null 2>&1 || true
FORWARDER_ID=\$(docker run -d --rm --network host --name "\$FORWARDER_NAME" alpine sh -c "apk add --no-cache socat >/dev/null && socat TCP-LISTEN:\$PRISMA_PORT,fork,reuseaddr TCP:\$CONTAINER_IP:\$PRISMA_PORT")

sleep 1
if ! docker ps --format '{{.Names}}' | grep -qw "\$FORWARDER_NAME"; then
  echo "✗ Failed to start forwarder container."
  exit 1
fi

echo "→ Forwarder ready. Launching Prisma Studio..."
docker exec -i "\$CONTAINER_NAME" sh -c 'cd /app && npx prisma studio --hostname 0.0.0.0 --port '"$PRISMA_PORT"' --browser none'
EOF
)

REMOTE_SCRIPT_B64=$(printf '%s' "$REMOTE_SCRIPT" | base64 | tr -d '\n')

SSH_LOCAL_SPEC="${LOCAL_PORT}:localhost:${PRISMA_PORT}"

if [ "$USE_TUNNEL" = "true" ]; then
  ssh \
    -L "$SSH_LOCAL_SPEC" \
    -o ProxyCommand="cloudflared access ssh --hostname $SSH_DOMAIN" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o PubkeyAuthentication=no \
    -o PasswordAuthentication=yes \
    "$username@$SSH_DOMAIN" "base64 --decode <<< '$REMOTE_SCRIPT_B64' | /bin/bash"
else
  sshpass -p "$password" ssh \
    -L "$SSH_LOCAL_SPEC" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "$username@$hostIp" "base64 --decode <<< '$REMOTE_SCRIPT_B64' | /bin/bash"
fi
