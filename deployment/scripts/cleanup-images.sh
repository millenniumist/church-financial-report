#!/usr/bin/env bash
set -euo pipefail

# Docker Image Cleanup Script
# Removes old rollback images and dangling images

KEEP_ROLLBACK_IMAGES="${KEEP_ROLLBACK_IMAGES:-5}"
DRY_RUN="${DRY_RUN:-false}"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

# Clean old rollback images
log "Cleaning rollback images (keeping last $KEEP_ROLLBACK_IMAGES per image)"

# Get all rollback tags, sorted by date (newest first)
rollback_images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "rollback-" | sort -r || true)

if [ -z "$rollback_images" ]; then
  log "No rollback images found"
else
  # Group by base image name
  declare -A image_counts
  
  while IFS= read -r image_tag; do
    # Extract base image name (before the rollback tag)
    base_image=$(echo "$image_tag" | cut -d: -f1)
    
    # Initialize counter if not exists
    if [ -z "${image_counts[$base_image]:-}" ]; then
      image_counts[$base_image]=0
    fi
    
    # Increment counter
    ((image_counts[$base_image]++))
    
    # If we've exceeded the keep limit, remove this image
    if [ "${image_counts[$base_image]}" -gt "$KEEP_ROLLBACK_IMAGES" ]; then
      if [ "$DRY_RUN" = "true" ]; then
        log "[DRY RUN] Would remove: $image_tag"
      else
        log "Removing old rollback image: $image_tag"
        docker rmi "$image_tag" 2>/dev/null || log "Failed to remove $image_tag (may be in use)"
      fi
    else
      log "Keeping: $image_tag (${image_counts[$base_image]}/$KEEP_ROLLBACK_IMAGES)"
    fi
  done <<< "$rollback_images"
fi

# Clean dangling images (untagged images from failed builds)
log "Cleaning dangling images..."
dangling_images=$(docker images -f "dangling=true" -q || true)

if [ -z "$dangling_images" ]; then
  log "No dangling images found"
else
  if [ "$DRY_RUN" = "true" ]; then
    log "[DRY RUN] Would remove $(echo "$dangling_images" | wc -l) dangling images"
  else
    echo "$dangling_images" | xargs -r docker rmi
    log "Removed dangling images"
  fi
fi

# Clean unused volumes (optional, be careful!)
if [ "${CLEAN_VOLUMES:-false}" = "true" ]; then
  log "Cleaning unused volumes..."
  if [ "$DRY_RUN" = "true" ]; then
    docker volume ls -qf dangling=true | wc -l | xargs -I {} log "[DRY RUN] Would remove {} unused volumes"
  else
    docker volume prune -f
    log "Removed unused volumes"
  fi
fi

# Show disk usage summary
log "Docker disk usage summary:"
docker system df

log "Cleanup complete!"
