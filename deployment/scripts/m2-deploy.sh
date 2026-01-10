#!/usr/bin/env bash
set -euo pipefail

# Configuration
ENVIRONMENT="${1:-dev}"
DEPLOY_ENV_FILE="$(dirname "$0")/../.env.deploy"

if [ ! -f "$DEPLOY_ENV_FILE" ]; then
    echo "Error: .env.deploy not found at $DEPLOY_ENV_FILE"
    exit 1
fi

# Load deployment config
# shellcheck disable=SC1090
source "$DEPLOY_ENV_FILE"

REMOTE_HOST="${hostIp}"
REMOTE_USER="${username}"
APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# Stack configuration based on environment
if [ "$ENVIRONMENT" == "prod" ]; then
    IMAGE_NAME="nextjs-app-prod"
    REMOTE_STACK_NAME="prod"
else
    IMAGE_NAME="nextjs-app"
    REMOTE_STACK_NAME="dev"
fi

echo "🚀 Starting M2 Build & Transfer for [$ENVIRONMENT]..."

# 1. Build for ARM64 on M2
echo "📦 Building Docker image [$IMAGE_NAME:latest] for linux/arm64..."
cd "$APP_DIR"
docker buildx build --platform linux/arm64 -t "$IMAGE_NAME:latest" . --load

# 2. Transfer image to Raspberry Pi
echo "trucking image to $REMOTE_HOST..."
if command -v sshpass &> /dev/null; then
    docker save "$IMAGE_NAME:latest" | sshpass -p "$password" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "docker load"
else
    docker save "$IMAGE_NAME:latest" | ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "docker load"
fi

# 3. Trigger remote deployment (optional)
if [ "${2:-}" != "--no-deploy" ]; then
    echo "🏗️ Triggering remote deployment on $REMOTE_HOST..."
    if command -v sshpass &> /dev/null; then
        sshpass -p "$password" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << EOF
            export SKIP_BUILD=true
            export ENVIRONMENT=$REMOTE_STACK_NAME
            source /srv/cc-financial/shared/gitops.env
            /srv/cc-financial/bin/deploy.sh
EOF
    else
        ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << EOF
            export SKIP_BUILD=true
            export ENVIRONMENT=$REMOTE_STACK_NAME
            source /srv/cc-financial/shared/gitops.env
            /srv/cc-financial/bin/deploy.sh
EOF
    fi
    echo "✅ M2 Build & Deploy completed!"
else
    echo "✅ Image transferred. Pi GitOps will handle the restart on push."
fi
