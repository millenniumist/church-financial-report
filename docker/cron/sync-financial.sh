#!/bin/sh
# Financial Data Sync Script
# This script is called by cron to sync data from Google Sheets to database

# Configuration
API_URL="${API_URL:-http://nextjs-app:3000/api/cron/sync-financial}"
TIMEOUT="${TIMEOUT:-30}"

# Log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting financial data sync..."

# Make API request
response=$(wget -qO- --timeout="$TIMEOUT" "$API_URL" 2>&1)
exit_code=$?

if [ $exit_code -eq 0 ]; then
    log "✓ Sync completed successfully"
    log "Response: $response"
else
    log "✗ Sync failed with exit code: $exit_code"
    log "Error: $response"
    exit 1
fi

log "Sync job finished"
