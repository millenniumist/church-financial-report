#!/bin/bash

# Backup Script for CC Financial Application
# Backs up PostgreSQL database, Docker volumes, and configuration files
# Usage: ./backup.sh [--remote]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="${BACKUP_DIR:-/home/mill/hosting/backups}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_DATE"
RETENTION_DAYS="${RETENTION_DAYS:-180}"  # 6 months

# Database Configuration
DB_NAME="${DB_NAME:-cc_financial}"
DB_USER="${DB_USER:-ccfinapp}"
DB_PASSWORD="${DB_PASSWORD:-cc2025secure}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Docker Configuration
CONTAINER_NAME="${CONTAINER_NAME:-nextjs-app}"
VOLUME_NAME="${VOLUME_NAME:-hosting_bulletins-data}"

# Remote backup configuration
REMOTE_BACKUP="${REMOTE_BACKUP:-false}"
REMOTE_BACKUP_HOST="${REMOTE_BACKUP_HOST:-}"
REMOTE_BACKUP_PATH="${REMOTE_BACKUP_PATH:-}"

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
while [[ $# -gt 0 ]]; do
  case $1 in
    --remote)
      REMOTE_BACKUP="true"
      shift
      ;;
    *)
      error "Unknown option: $1"
      ;;
  esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"
info "Created backup directory: $BACKUP_DIR"

# Backup log
LOG_FILE="$BACKUP_DIR/backup.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "=================================="
echo "Backup Started: $(date)"
echo "=================================="
echo ""

# 1. Backup PostgreSQL Database
info "Backing up PostgreSQL database: $DB_NAME"
DB_BACKUP_FILE="$BACKUP_DIR/database_${DB_NAME}.sql"
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$DB_BACKUP_FILE" || error "Database backup failed"
DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
success "Database backed up: $DB_BACKUP_FILE ($DB_SIZE)"

# 2. Backup Docker Volume (bulletins-data)
info "Backing up Docker volume: $VOLUME_NAME"
VOLUME_BACKUP_FILE="$BACKUP_DIR/volume_bulletins-data.tar.gz"

# Check if volume exists
if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  # Create temporary container to backup volume
  docker run --rm \
    -v "$VOLUME_NAME:/data:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine:latest \
    tar czf "/backup/volume_bulletins-data.tar.gz" -C /data . || error "Volume backup failed"

  VOLUME_SIZE=$(du -h "$VOLUME_BACKUP_FILE" | cut -f1)
  success "Volume backed up: $VOLUME_BACKUP_FILE ($VOLUME_SIZE)"
else
  warn "Volume $VOLUME_NAME not found, skipping volume backup"
fi

# 3. Backup Configuration Files
info "Backing up configuration files"
CONFIG_BACKUP_DIR="$BACKUP_DIR/config"
mkdir -p "$CONFIG_BACKUP_DIR"

# Backup .env.production if exists
if [ -f "$DEPLOY_DIR/../.env.production" ]; then
  cp "$DEPLOY_DIR/../.env.production" "$CONFIG_BACKUP_DIR/"
  success "Backed up .env.production"
fi

# Backup deployment config
if [ -f "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env" "$CONFIG_BACKUP_DIR/deployment.env"
  success "Backed up deployment .env"
fi

# Backup Cloudflare config
if [ -d "$DEPLOY_DIR/cloudflare" ]; then
  cp -r "$DEPLOY_DIR/cloudflare" "$CONFIG_BACKUP_DIR/"
  success "Backed up Cloudflare configuration"
fi

# Backup docker-compose file
if [ -f "$DEPLOY_DIR/docker-compose.selfhost.yml" ]; then
  cp "$DEPLOY_DIR/docker-compose.selfhost.yml" "$CONFIG_BACKUP_DIR/"
  success "Backed up docker-compose configuration"
fi

# 4. Create backup metadata
info "Creating backup metadata"
cat > "$BACKUP_DIR/backup-metadata.json" <<METADATA
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "date": "$BACKUP_DATE",
  "hostname": "$(hostname)",
  "database": {
    "name": "$DB_NAME",
    "file": "database_${DB_NAME}.sql",
    "size": "$DB_SIZE"
  },
  "volume": {
    "name": "$VOLUME_NAME",
    "file": "volume_bulletins-data.tar.gz",
    "size": "${VOLUME_SIZE:-N/A}"
  },
  "container": "$CONTAINER_NAME"
}
METADATA
success "Backup metadata created"

# 5. Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
info "Total backup size: $TOTAL_SIZE"

# 6. Transfer to remote backup location (if enabled)
if [ "$REMOTE_BACKUP" = "true" ] && [ -n "$REMOTE_BACKUP_HOST" ] && [ -n "$REMOTE_BACKUP_PATH" ]; then
  info "Transferring backup to remote location: $REMOTE_BACKUP_HOST:$REMOTE_BACKUP_PATH"

  # Create remote directory
  ssh "$REMOTE_BACKUP_HOST" "mkdir -p $REMOTE_BACKUP_PATH" || warn "Failed to create remote directory"

  # Sync backup directory to remote
  rsync -avz --progress "$BACKUP_DIR" "$REMOTE_BACKUP_HOST:$REMOTE_BACKUP_PATH/" || warn "Remote backup transfer failed"

  success "Backup transferred to remote location"
fi

# 7. Cleanup old backups (retention policy)
info "Applying retention policy (keeping last $RETENTION_DAYS days)"
find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
REMAINING_BACKUPS=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | wc -l)
info "Remaining backups: $REMAINING_BACKUPS"

echo ""
echo "=================================="
echo "Backup Completed: $(date)"
echo "=================================="
echo ""
success "Backup saved to: $BACKUP_DIR"
success "Total size: $TOTAL_SIZE"
echo ""
echo "To restore this backup, run:"
echo "  ./restore.sh $BACKUP_DATE"
echo ""
