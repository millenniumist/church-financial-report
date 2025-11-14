#!/bin/bash

# Setup Cron Job for Automated Backups
# Installs a cron job that runs backup.sh daily at 2 AM
# Usage: ./setup-cron.sh [--uninstall]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
CRON_TIME="${CRON_TIME:-0 2 * * *}"  # Default: 2 AM daily
CRON_USER="${CRON_USER:-$(whoami)}"

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
    --help)
      cat <<EOF
Usage: $0 [OPTIONS]

Setup or remove automated backup cron job

Options:
  --uninstall    Remove the cron job
  --help         Show this help message

Environment Variables:
  CRON_TIME      Cron schedule (default: 0 2 * * * = 2 AM daily)
  CRON_USER      User to run cron job as (default: current user)

Examples:
  $0                          # Install cron job (2 AM daily)
  CRON_TIME="0 3 * * *" $0    # Install at 3 AM daily
  $0 --uninstall              # Remove cron job
EOF
      exit 0
      ;;
    *)
      error "Unknown option: $1"
      ;;
  esac
done

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
  error "Backup script not found: $BACKUP_SCRIPT"
fi

# Make sure backup script is executable
chmod +x "$BACKUP_SCRIPT"

# Cron job entry
CRON_JOB="$CRON_TIME $BACKUP_SCRIPT >> /home/mill/hosting/backups/cron.log 2>&1"
CRON_COMMENT="# Automated backup for CC Financial Application"

# Function to check if cron job exists
cron_exists() {
  crontab -l 2>/dev/null | grep -F "$BACKUP_SCRIPT" >/dev/null 2>&1
}

# Uninstall cron job
if [ "$UNINSTALL" = "true" ]; then
  info "Removing automated backup cron job"

  if ! cron_exists; then
    warn "No cron job found for $BACKUP_SCRIPT"
    exit 0
  fi

  # Remove cron job
  crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | grep -v "Automated backup for CC Financial" | crontab - || true

  if cron_exists; then
    error "Failed to remove cron job"
  else
    success "Cron job removed successfully"
  fi

  exit 0
fi

# Install cron job
echo ""
echo "=================================="
echo "Setup Automated Backup Cron Job"
echo "=================================="
echo ""
info "Backup script: $BACKUP_SCRIPT"
info "Schedule: $CRON_TIME (cron format)"
info "User: $CRON_USER"
echo ""

# Explain schedule in human-readable format
case "$CRON_TIME" in
  "0 2 * * *")
    info "Schedule: Daily at 2:00 AM"
    ;;
  "0 3 * * *")
    info "Schedule: Daily at 3:00 AM"
    ;;
  "0 */6 * * *")
    info "Schedule: Every 6 hours"
    ;;
  "0 0 * * 0")
    info "Schedule: Weekly on Sunday at midnight"
    ;;
  *)
    info "Schedule: Custom ($CRON_TIME)"
    ;;
esac
echo ""

# Check if cron job already exists
if cron_exists; then
  warn "Cron job already exists"
  echo ""
  echo "Current cron jobs:"
  crontab -l 2>/dev/null | grep -A1 -B1 "$BACKUP_SCRIPT" || true
  echo ""
  read -p "Do you want to replace it? (yes/no): " -r CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    info "Installation cancelled"
    exit 0
  fi

  # Remove existing cron job
  crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | grep -v "Automated backup for CC Financial" | crontab - || true
fi

# Add new cron job
info "Installing cron job"
(
  crontab -l 2>/dev/null || true
  echo ""
  echo "$CRON_COMMENT"
  echo "$CRON_JOB"
) | crontab -

# Verify installation
if cron_exists; then
  success "Cron job installed successfully"
else
  error "Failed to install cron job"
fi

echo ""
echo "Installed cron job:"
crontab -l 2>/dev/null | grep -A1 "$CRON_COMMENT" || true
echo ""

# Check if cron service is running
if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet cronie 2>/dev/null; then
    success "Cron service is running"
  else
    warn "Cron service may not be running. Start it with:"
    echo "  sudo systemctl start cron    # Debian/Ubuntu"
    echo "  sudo systemctl start cronie  # CentOS/RHEL"
  fi
fi

echo ""
echo "Next steps:"
echo "  - View cron jobs: crontab -l"
echo "  - Test backup manually: $BACKUP_SCRIPT"
echo "  - Check cron logs: tail -f /home/mill/hosting/backups/cron.log"
echo "  - Remove cron job: $0 --uninstall"
echo ""
success "Automated backup setup complete"
echo ""
