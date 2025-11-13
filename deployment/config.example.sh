#!/bin/bash
# Global Configuration Template
# Copy this file to config.sh and customize for your environment

# ============================================================================
# Monorepo Structure
# ============================================================================
# NOTE: In the monorepo, the app source is at ../app (parent directory)
# No need to sync from a separate DEV_DIR anymore!
# The deployment scripts now work directly with the monorepo structure.

# ============================================================================
# Cloudflare Tunnel Configuration
# ============================================================================
# Tunnel name (must match the name you created with: cloudflared tunnel create)
CLOUDFLARE_TUNNEL_NAME="millenniumist"

# Primary domain (without https://)
DOMAIN="millenniumist.dpdns.org"

# Additional domains (space-separated, optional)
# ADDITIONAL_DOMAINS="www.millenniumist.dpdns.org"

# ============================================================================
# Docker Configuration
# ============================================================================
# Container name for the Next.js app
CONTAINER_NAME="nextjs-app"

# Port to expose (host:container)
APP_PORT="8358"

# Docker Compose project name (optional - defaults to directory name)
# COMPOSE_PROJECT_NAME="hosting"

# ============================================================================
# Remote Host Configuration (for Filebeat/logging)
# ============================================================================
# If deploying to a remote Pi with Filebeat, set the SSH connection
# REMOTE_HOST="mill@192.168.68.117"
# REMOTE_HOSTING_DIR="/home/mill/hosting"

# ============================================================================
# Application Environment
# ============================================================================
# Node environment
NODE_ENV="production"

# Which env file to sync from development repo
# Options: .env, .env.local, .env.production
DEV_ENV_FILE=".env"

# ============================================================================
# Optional: Email for notifications/SSL (if needed in future)
# ============================================================================
# EMAIL="your-email@example.com"

# ============================================================================
# Advanced: Cloudflare Account (for reference only)
# ============================================================================
# CLOUDFLARE_ZONE_ID="your-zone-id"
# CLOUDFLARE_ACCOUNT_ID="your-account-id"
