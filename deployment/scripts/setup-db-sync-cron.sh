#!/bin/bash

# Setup Cron Job for Automated Database Synchronization (Pi -> Cloud)
# Installs a cron job that runs 'npm run db:sync' daily at 2 AM
# Usage: ./setup-db-sync-cron.sh [--uninstall]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="/srv/cc-financial/current"
CRON_TIME="${CRON_TIME:-0 2 * * *}"  # Default: 2 AM daily
LOG_FILE="/srv/cc-financial/logs/db-sync.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# Parse arguments
UNINSTALL="false"
while [[ $# -gt 0 ]]; do
  case $1 in
    --uninstall)
      UNINSTALL="true"
      shift
      ;;
    *)
      error "Unknown option: $1"
      ;;
  esac
done

# Cron job identification string
CRON_ID="db-sync-pi-to-cloud"
# We use bash -l to ensure npm and node are in the PATH
CRON_JOB="$CRON_TIME cd $DEPLOY_DIR && /usr/bin/npm run db:sync >> $LOG_FILE 2>&1  # $CRON_ID"

# Function to check if cron job exists
cron_exists() {
  crontab -l 2>/dev/null | grep -F "$CRON_ID" >/dev/null 2>&1
}

# Uninstall cron job
if [ "$UNINSTALL" = "true" ]; then
  info "Removing automated database sync cron job"

  if ! cron_exists; then
    warn "No cron job found for database synchronization"
    exit 0
  fi

  # Remove cron job
  crontab -l 2>/dev/null | grep -v "$CRON_ID" | crontab - || true
  success "Sync cron job removed successfully"
  exit 0
fi

# Install cron job
info "Setting up daily database sync (Pi -> Cloud) at 2 AM Bangkok time"
info "Deployment directory: $DEPLOY_DIR"
info "Log file: $LOG_FILE"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Check if cron job already exists
if cron_exists; then
  warn "Database sync cron job already exists. Updating..."
  crontab -l 2>/dev/null | grep -v "$CRON_ID" | crontab - || true
fi

# Add new cron job
(
  crontab -l 2>/dev/null || true
  echo "$CRON_JOB"
) | crontab -

# Verify installation
if cron_exists; then
  success "Database sync cron job installed successfully"
  echo ""
  echo "Current cron entry:"
  crontab -l | grep "$CRON_ID"
else
  error "Failed to install database sync cron job"
fi

echo ""
info "Note: Ensure that /srv/cc-financial/current/.env has DATABASE_URL_SECONDARY configured."
