#!/bin/bash
# Deployment script for cc-financial to hosting directory

set -e

# Configuration
SOURCE_DIR="/Users/suparit/Desktop/code/cc-financial"
HOSTING_DIR="/Users/suparit/Desktop/code/hosting/app"

echo "🚀 Deploying cc-financial to hosting directory..."

# Check if directories exist
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$HOSTING_DIR" ]; then
    echo "📁 Creating hosting directory: $HOSTING_DIR"
    mkdir -p "$HOSTING_DIR"
fi

# Sync files (excluding node_modules, .next, etc.)
echo "📦 Syncing application files..."
rsync -av --exclude='node_modules' \
          --exclude='.next' \
          --exclude='.git' \
          --exclude='*.log' \
          --exclude='.env.local' \
          --exclude='deploy.sh' \
          "$SOURCE_DIR/" "$HOSTING_DIR/"

# Copy environment file if it doesn't exist
if [ -f "$SOURCE_DIR/.env.local" ] && [ ! -f "$HOSTING_DIR/.env.local" ]; then
    echo "📄 Copying environment file..."
    cp "$SOURCE_DIR/.env.local" "$HOSTING_DIR/.env.local"
fi

# Update docker-compose in hosting root
echo "🐳 Updating docker-compose configuration..."
cp "$SOURCE_DIR/docker-compose.yml" "/Users/suparit/Desktop/code/hosting/docker-compose.selfhost.yml"

# Update cron files
echo "⏰ Updating cron configuration..."
mkdir -p "/Users/suparit/Desktop/code/hosting/cron"
cp -r "$SOURCE_DIR/docker/cron/"* "/Users/suparit/Desktop/code/hosting/cron/"

echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. cd /Users/suparit/Desktop/code/hosting"
echo "2. Review .env.local and update DATABASE_URL"
echo "3. docker-compose -f docker-compose.selfhost.yml up -d --build"
echo "4. docker-compose -f docker-compose.selfhost.yml logs -f"
