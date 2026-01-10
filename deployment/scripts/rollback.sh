#!/usr/bin/env bash
set -euo pipefail

# Quick Rollback Script
# Usage: ./rollback.sh [dev|prod] [steps_back]
# Example: ./rollback.sh dev 1  (rollback to previous release)

ENVIRONMENT="${1:-dev}"
STEPS_BACK="${2:-1}"
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

echo "🔄 Rolling back [$ENVIRONMENT] by $STEPS_BACK release(s)..."

# SSH into Pi and perform rollback
if command -v sshpass &> /dev/null; then
    sshpass -p "$password" ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << EOF
set -e

DEPLOY_DIR="/srv/cc-financial"
if [ "$ENVIRONMENT" == "prod" ]; then
    RELEASES_DIR="\$DEPLOY_DIR/prod/releases"
    CURRENT_LINK="\$DEPLOY_DIR/prod/current"
    SHA_FILE="\$DEPLOY_DIR/prod/current.sha"
    STACK_NAME="prod"
else
    RELEASES_DIR="\$DEPLOY_DIR/dev/releases"
    CURRENT_LINK="\$DEPLOY_DIR/dev/current"
    SHA_FILE="\$DEPLOY_DIR/dev/current.sha"
    STACK_NAME="dev"
fi

# Find the target release (skip current, go back N steps)
TARGET_RELEASE=\$(ls -1dt "\$RELEASES_DIR"/* 2>/dev/null | sed -n "\$((STEPS_BACK + 1))p")

if [ -z "\$TARGET_RELEASE" ]; then
    echo "❌ No release found at position $STEPS_BACK"
    echo "Available releases:"
    ls -1dt "\$RELEASES_DIR"/* 2>/dev/null | head -5
    exit 1
fi

CURRENT_RELEASE=\$(readlink -f "\$CURRENT_LINK" 2>/dev/null || echo "none")
echo "📍 Current release: \$CURRENT_RELEASE"
echo "🎯 Target release:  \$TARGET_RELEASE"

# Extract SHA from directory name
SHA=\$(basename "\$TARGET_RELEASE" | grep -oP '(?<=-)[a-f0-9]+$' || echo "unknown")

# Update symlink
ln -sfn "\$TARGET_RELEASE" "\$CURRENT_LINK"
echo "\$SHA" > "\$SHA_FILE"

echo "✅ Symlink updated to \$TARGET_RELEASE"

# Restart the stack
echo "🔄 Restarting stack..."
cd "\$TARGET_RELEASE"

# Determine compose file based on environment
if [ "$ENVIRONMENT" == "prod" ]; then
    COMPOSE_FILE="deployment/docker-compose.prod.yml"
else
    COMPOSE_FILE="deployment/docker-compose.selfhost.yml"
fi

COMPOSE_PROJECT_NAME="cc-financial-app" docker compose \\
    -f "\$COMPOSE_FILE" \\
    --env-file "\$DEPLOY_DIR/shared/.env" \\
    up -d --remove-orphans

echo "✅ Rollback complete!"
echo "📊 Checking container status..."
docker ps --filter "name=cc-financial"

EOF
else
    ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" << EOF
set -e

DEPLOY_DIR="/srv/cc-financial"
if [ "$ENVIRONMENT" == "prod" ]; then
    RELEASES_DIR="\$DEPLOY_DIR/prod/releases"
    CURRENT_LINK="\$DEPLOY_DIR/prod/current"
    SHA_FILE="\$DEPLOY_DIR/prod/current.sha"
    STACK_NAME="prod"
else
    RELEASES_DIR="\$DEPLOY_DIR/dev/releases"
    CURRENT_LINK="\$DEPLOY_DIR/dev/current"
    SHA_FILE="\$DEPLOY_DIR/dev/current.sha"
    STACK_NAME="dev"
fi

# Find the target release (skip current, go back N steps)
TARGET_RELEASE=\$(ls -1dt "\$RELEASES_DIR"/* 2>/dev/null | sed -n "\$((STEPS_BACK + 1))p")

if [ -z "\$TARGET_RELEASE" ]; then
    echo "❌ No release found at position $STEPS_BACK"
    echo "Available releases:"
    ls -1dt "\$RELEASES_DIR"/* 2>/dev/null | head -5
    exit 1
fi

CURRENT_RELEASE=\$(readlink -f "\$CURRENT_LINK" 2>/dev/null || echo "none")
echo "📍 Current release: \$CURRENT_RELEASE"
echo "🎯 Target release:  \$TARGET_RELEASE"

# Extract SHA from directory name
SHA=\$(basename "\$TARGET_RELEASE" | grep -oP '(?<=-)[a-f0-9]+$' || echo "unknown")

# Update symlink
ln -sfn "\$TARGET_RELEASE" "\$CURRENT_LINK"
echo "\$SHA" > "\$SHA_FILE"

echo "✅ Symlink updated to \$TARGET_RELEASE"

# Restart the stack
echo "🔄 Restarting stack..."
cd "\$TARGET_RELEASE"

# Determine compose file based on environment
if [ "$ENVIRONMENT" == "prod" ]; then
    COMPOSE_FILE="deployment/docker-compose.prod.yml"
else
    COMPOSE_FILE="deployment/docker-compose.selfhost.yml"
fi

COMPOSE_PROJECT_NAME="cc-financial-app" docker compose \\
    -f "\$COMPOSE_FILE" \\
    --env-file "\$DEPLOY_DIR/shared/.env" \\
    up -d --remove-orphans

echo "✅ Rollback complete!"
echo "📊 Checking container status..."
docker ps --filter "name=cc-financial"

EOF
fi

echo ""
echo "🎉 Rollback to previous release completed!"
echo "🔍 Check your app to verify it's working correctly"
