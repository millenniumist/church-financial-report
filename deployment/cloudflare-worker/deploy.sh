#!/bin/bash

# Cloudflare Worker Deployment Script
# Automates the deployment of the external health monitor

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================="
echo "Cloudflare Worker Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
    echo -e "${GREEN}✓ Wrangler installed${NC}"
fi

# Check if logged in
echo -e "${YELLOW}Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Opening browser for authentication...${NC}"
    wrangler login
fi

echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"
echo ""

# Check if KV namespace ID is set
KV_ID=$(grep "^id = " wrangler.toml | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
    echo -e "${YELLOW}KV namespace not configured. Creating...${NC}"

    # Create KV namespace
    KV_OUTPUT=$(wrangler kv:namespace create "HEALTH_STATE")

    # Extract ID from output
    NEW_KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

    if [ -z "$NEW_KV_ID" ]; then
        echo -e "${RED}Failed to create KV namespace. Please create manually:${NC}"
        echo "  wrangler kv:namespace create \"HEALTH_STATE\""
        exit 1
    fi

    # Update wrangler.toml
    sed -i.bak "s/id = \"\"/id = \"$NEW_KV_ID\"/" wrangler.toml
    rm wrangler.toml.bak

    echo -e "${GREEN}✓ KV namespace created: $NEW_KV_ID${NC}"
else
    echo -e "${GREEN}✓ KV namespace already configured: $KV_ID${NC}"
fi

echo ""

# Check if secrets are set
echo -e "${YELLOW}Checking Discord credentials...${NC}"
echo ""

if ! wrangler secret list 2>/dev/null | grep -q "DISCORD_BOT_TOKEN"; then
    echo -e "${YELLOW}Discord bot token not set.${NC}"
    echo "Please enter your Discord bot token (use the value from deployment/.env: DISCORD_BOT_TOKEN)."
    echo ""
    wrangler secret put DISCORD_BOT_TOKEN
else
    echo -e "${GREEN}✓ DISCORD_BOT_TOKEN configured${NC}"
fi

if ! wrangler secret list 2>/dev/null | grep -q "DISCORD_CHANNEL_ID"; then
    echo -e "${YELLOW}Discord channel ID not set.${NC}"
    echo "Please enter your Discord channel ID (use deployment/.env: DISCORD_CHANNEL_ID)."
    echo ""
    wrangler secret put DISCORD_CHANNEL_ID
else
    echo -e "${GREEN}✓ DISCORD_CHANNEL_ID configured${NC}"
fi

echo ""
echo -e "${YELLOW}Deploying worker...${NC}"

# Deploy
wrangler deploy

echo ""
echo -e "${GREEN}=================================="
echo -e "✅ Deployment Complete"
echo -e "==================================${NC}"
echo ""
echo "Your external health monitor is now running!"
echo ""
echo "Monitor logs:"
echo "  wrangler tail"
echo ""
echo "Check status:"
echo "  curl https://cc-church-health-watcher.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "View metrics:"
echo "  https://dash.cloudflare.com/"
echo ""
