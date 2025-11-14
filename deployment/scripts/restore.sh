#!/bin/bash

# Restore Script for CC Financial Application
# Restores PostgreSQL database, Docker volumes, and configuration files
# Usage: ./restore.sh <backup_timestamp> [--skip-db] [--skip-volume] [--skip-config]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="${BACKUP_DIR:-/home/mill/hosting/backups}"

# Database Configuration
DB_NAME="${DB_NAME:-cc_financial}"
DB_USER="${DB_USER:-ccfinapp}"
DB_PASSWORD="${DB_PASSWORD:-cc2025secure}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Docker Configuration
CONTAINER_NAME="${CONTAINER_NAME:-nextjs-app}"
VOLUME_NAME="${VOLUME_NAME:-hosting_bulletins-data}"

# Restore options
SKIP_DB="false"
SKIP_VOLUME="false"
SKIP_CONFIG="false"

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

# Show usage
usage() {
  cat <<EOF
Usage: $0 <backup_timestamp> [OPTIONS]

Restore from a backup created by backup.sh

Arguments:
  backup_timestamp    Timestamp of the backup to restore (format: YYYYMMDD_HHMMSS)
                     Use 'list' to see available backups

Options:
  --skip-db          Skip database restoration
  --skip-volume      Skip volume restoration
  --skip-config      Skip configuration restoration
  --help             Show this help message

Examples:
  $0 list                        # List available backups
  $0 20250114_020000             # Restore full backup
  $0 20250114_020000 --skip-db   # Restore only volume and config
EOF
  exit 1
}

# List available backups
list_backups() {
  echo ""
  echo "Available backups in $BACKUP_BASE_DIR:"
  echo ""

  if [ ! -d "$BACKUP_BASE_DIR" ]; then
    warn "No backup directory found at $BACKUP_BASE_DIR"
    exit 0
  fi

  backups=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | sort -r)

  if [ -z "$backups" ]; then
    warn "No backups found"
    exit 0
  fi

  while IFS= read -r backup; do
    timestamp=$(basename "$backup")
    size=$(du -sh "$backup" 2>/dev/null | cut -f1)
    metadata="$backup/backup-metadata.json"

    echo -ne "  ${GREEN}$timestamp${NC}  ($size)"

    if [ -f "$metadata" ]; then
      db_size=$(grep -o '"size": "[^"]*"' "$metadata" | head -1 | cut -d'"' -f4)
      echo " - DB: $db_size"
    else
      echo ""
    fi
  done <<< "$backups"

  echo ""
  echo "To restore a backup, run:"
  echo "  $0 <timestamp>"
  echo ""
  exit 0
}

# Parse arguments
if [ $# -eq 0 ]; then
  usage
fi

BACKUP_TIMESTAMP="$1"
shift

# Handle 'list' command
if [ "$BACKUP_TIMESTAMP" = "list" ]; then
  list_backups
fi

# Parse options
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-db)
      SKIP_DB="true"
      shift
      ;;
    --skip-volume)
      SKIP_VOLUME="true"
      shift
      ;;
    --skip-config)
      SKIP_CONFIG="true"
      shift
      ;;
    --help)
      usage
      ;;
    *)
      error "Unknown option: $1"
      ;;
  esac
done

# Validate backup directory
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_TIMESTAMP"
if [ ! -d "$BACKUP_DIR" ]; then
  error "Backup directory not found: $BACKUP_DIR"
fi

info "Restoring from backup: $BACKUP_TIMESTAMP"
info "Backup location: $BACKUP_DIR"

# Load backup metadata
METADATA_FILE="$BACKUP_DIR/backup-metadata.json"
if [ -f "$METADATA_FILE" ]; then
  info "Backup metadata:"
  cat "$METADATA_FILE"
  echo ""
fi

# Confirmation prompt
echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
echo ""
echo "What will be restored:"
[ "$SKIP_DB" = "false" ] && echo "  - Database: $DB_NAME"
[ "$SKIP_VOLUME" = "false" ] && echo "  - Volume: $VOLUME_NAME"
[ "$SKIP_CONFIG" = "false" ] && echo "  - Configuration files"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  info "Restore cancelled"
  exit 0
fi

echo ""
echo "=================================="
echo "Restore Started: $(date)"
echo "=================================="
echo ""

# 1. Restore PostgreSQL Database
if [ "$SKIP_DB" = "false" ]; then
  DB_BACKUP_FILE="$BACKUP_DIR/database_${DB_NAME}.sql"

  if [ ! -f "$DB_BACKUP_FILE" ]; then
    warn "Database backup file not found: $DB_BACKUP_FILE"
  else
    info "Restoring PostgreSQL database: $DB_NAME"

    # Stop the application container to avoid conflicts
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      info "Stopping application container: $CONTAINER_NAME"
      docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    fi

    # Drop and recreate database
    warn "Dropping existing database: $DB_NAME"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || error "Failed to drop database"

    info "Creating new database: $DB_NAME"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || error "Failed to create database"

    # Restore database
    info "Restoring database from backup..."
    PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$DB_BACKUP_FILE" || error "Database restore failed"

    success "Database restored successfully"
  fi
fi

# 2. Restore Docker Volume
if [ "$SKIP_VOLUME" = "false" ]; then
  VOLUME_BACKUP_FILE="$BACKUP_DIR/volume_bulletins-data.tar.gz"

  if [ ! -f "$VOLUME_BACKUP_FILE" ]; then
    warn "Volume backup file not found: $VOLUME_BACKUP_FILE"
  else
    info "Restoring Docker volume: $VOLUME_NAME"

    # Check if volume exists, create if not
    if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
      info "Creating volume: $VOLUME_NAME"
      docker volume create "$VOLUME_NAME" || error "Failed to create volume"
    fi

    # Restore volume contents
    docker run --rm \
      -v "$VOLUME_NAME:/data" \
      -v "$BACKUP_DIR:/backup:ro" \
      alpine:latest \
      sh -c "rm -rf /data/* && tar xzf /backup/volume_bulletins-data.tar.gz -C /data" || error "Volume restore failed"

    success "Volume restored successfully"
  fi
fi

# 3. Restore Configuration Files
if [ "$SKIP_CONFIG" = "false" ]; then
  CONFIG_BACKUP_DIR="$BACKUP_DIR/config"

  if [ ! -d "$CONFIG_BACKUP_DIR" ]; then
    warn "Configuration backup directory not found: $CONFIG_BACKUP_DIR"
  else
    info "Restoring configuration files"

    # Restore .env.production
    if [ -f "$CONFIG_BACKUP_DIR/.env.production" ]; then
      cp "$CONFIG_BACKUP_DIR/.env.production" "$DEPLOY_DIR/../.env.production"
      success "Restored .env.production"
    fi

    # Restore deployment .env
    if [ -f "$CONFIG_BACKUP_DIR/deployment.env" ]; then
      cp "$CONFIG_BACKUP_DIR/deployment.env" "$DEPLOY_DIR/.env"
      success "Restored deployment .env"
    fi

    # Restore Cloudflare config
    if [ -d "$CONFIG_BACKUP_DIR/cloudflare" ]; then
      rm -rf "$DEPLOY_DIR/cloudflare"
      cp -r "$CONFIG_BACKUP_DIR/cloudflare" "$DEPLOY_DIR/"
      success "Restored Cloudflare configuration"
    fi

    # Restore docker-compose file
    if [ -f "$CONFIG_BACKUP_DIR/docker-compose.selfhost.yml" ]; then
      cp "$CONFIG_BACKUP_DIR/docker-compose.selfhost.yml" "$DEPLOY_DIR/"
      success "Restored docker-compose configuration"
    fi

    success "Configuration files restored"
  fi
fi

# 4. Restart application container
if [ "$SKIP_DB" = "false" ] || [ "$SKIP_VOLUME" = "false" ]; then
  info "Restarting application container: $CONTAINER_NAME"

  cd "$DEPLOY_DIR"

  # Determine Docker Compose command
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  else
    DOCKER_COMPOSE_CMD="docker-compose"
  fi

  # Start container
  $DOCKER_COMPOSE_CMD -f docker-compose.selfhost.yml up -d "$CONTAINER_NAME" || warn "Failed to start container"

  # Wait for container to be ready
  sleep 5

  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    success "Application container started successfully"
  else
    warn "Container may not have started correctly. Check: docker logs $CONTAINER_NAME"
  fi
fi

echo ""
echo "=================================="
echo "Restore Completed: $(date)"
echo "=================================="
echo ""
success "Restore completed successfully from backup: $BACKUP_TIMESTAMP"
echo ""
echo "Next steps:"
echo "  - Verify application is running: docker ps"
echo "  - Check logs: docker logs $CONTAINER_NAME"
echo "  - Test application: curl http://localhost:8358/api/health"
echo ""
