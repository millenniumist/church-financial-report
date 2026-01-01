#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/srv/cc-financial}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
BRANCH="${BRANCH:-main}"
RELEASES_DIR="${RELEASES_DIR:-$DEPLOY_DIR/releases}"
SHARED_ENV="${SHARED_ENV:-$DEPLOY_DIR/shared/.env}"
LOG_DIR="${LOG_DIR:-$DEPLOY_DIR/logs}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
STACKS_FILE="${STACKS_FILE:-$DEPLOY_DIR/shared/stacks.conf}"
ROLLBACK_DIR="${ROLLBACK_DIR:-$DEPLOY_DIR/rollbacks}"
ROLLBACK_MODE="${ROLLBACK_MODE:-all}"
COMPOSE_PROJECT_PREFIX="${COMPOSE_PROJECT_PREFIX:-cc-financial}"
HEALTH_RETRIES="${HEALTH_RETRIES:-10}"
HEALTH_DELAY_SECONDS="${HEALTH_DELAY_SECONDS:-3}"
SYNC_SOURCE_DIR="${SYNC_SOURCE_DIR:-$DEPLOY_DIR/shared}"
SYNC_PATHS="${SYNC_PATHS:-}"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_DIR/deploy.log"
}

trim() {
  local value="$1"
  value="${value#${value%%[![:space:]]*}}"
  value="${value%${value##*[![:space:]]}}"
  printf '%s' "$value"
}

sanitize_image() {
  printf '%s' "$1" | tr -c 'a-zA-Z0-9_.-' '_'
}

save_rollback_image() {
  local stack="$1"
  local image="$2"
  local sanitized
  sanitized="$(sanitize_image "$image")"

  if ! docker image inspect "$image:latest" >/dev/null 2>&1; then
    log "no existing image for rollback: $image:latest"
    return 0
  fi

  local tag
  tag="rollback-${timestamp}-${stack}-${sanitized}"
  docker tag "$image:latest" "$image:$tag"
  mkdir -p "$ROLLBACK_DIR/$stack"
  echo "$tag" > "$ROLLBACK_DIR/$stack/$sanitized.tag"
  log "saved rollback image $image:$tag"
}

rollback_stack() {
  local stack="$1"
  local compose_path="$2"
  local build_image="$3"
  local rollback_images="$4"
  local compose_file

  log "rollback stack: $stack"

  local images=()
  if [ -n "$rollback_images" ]; then
    IFS=',' read -r -a images <<< "$rollback_images"
  elif [ -n "$build_image" ]; then
    images=("$build_image")
  fi

  for image in "${images[@]}"; do
    image="$(trim "$image")"
    [ -z "$image" ] && continue
    local sanitized tag_file tag
    sanitized="$(sanitize_image "$image")"
    tag_file="$ROLLBACK_DIR/$stack/$sanitized.tag"
    if [ -f "$tag_file" ]; then
      tag="$(cat "$tag_file")"
      if docker image inspect "$image:$tag" >/dev/null 2>&1; then
        docker tag "$image:$tag" "$image:latest"
        log "restored image $image:latest from $tag"
      fi
    fi
  done

  if [ -n "$previous_release" ]; then
    compose_file="$previous_release/$compose_path"
    if [ -f "$compose_file" ]; then
      COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_PREFIX-$stack" docker compose \
        -f "$compose_file" \
        --env-file "$SHARED_ENV" \
        up -d --remove-orphans
    else
      log "rollback compose file missing: $compose_file"
    fi
  else
    log "no previous release available for rollback"
  fi
}

health_check() {
  local url="$1"
  local attempt
  for attempt in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep "$HEALTH_DELAY_SECONDS"
  done
  return 1
}

sync_paths() {
  [ -z "$SYNC_PATHS" ] && return 0

  IFS=',' read -r -a paths <<< "$SYNC_PATHS"
  for raw in "${paths[@]}"; do
    local rel src dst
    rel="$(trim "$raw")"
    [ -z "$rel" ] && continue
    src="$SYNC_SOURCE_DIR/$rel"
    dst="$release_dir/$rel"

    if [ -d "$src" ]; then
      mkdir -p "$dst"
      cp -a "$src/." "$dst/"
      log "synced dir $rel"
    elif [ -f "$src" ]; then
      mkdir -p "$(dirname "$dst")"
      cp -a "$src" "$dst"
      log "synced file $rel"
    else
      log "sync source missing: $src"
    fi
  done
}

mkdir -p "$RELEASES_DIR" "$LOG_DIR" "$ROLLBACK_DIR"

exec 9>"$DEPLOY_DIR/deploy.lock"
if ! flock -n 9; then
  log "deploy already running; exiting"
  exit 0
fi

previous_release=""
if [ -L "$DEPLOY_DIR/current" ]; then
  previous_release="$(readlink -f "$DEPLOY_DIR/current")"
fi

if [ ! -f "$SHARED_ENV" ]; then
  log "missing shared env file: $SHARED_ENV"
  exit 1
fi

if [ ! -f "$STACKS_FILE" ]; then
  log "missing stacks file: $STACKS_FILE"
  exit 1
fi

timestamp="$(date -u '+%Y%m%d%H%M%S')"
tmp_dir="$RELEASES_DIR/${timestamp}-tmp"

log "cloning $REPO_URL ($BRANCH)"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$tmp_dir"
sha="$(git -C "$tmp_dir" rev-parse --short HEAD)"
release_dir="$RELEASES_DIR/${timestamp}-${sha}"
mv "$tmp_dir" "$release_dir"

sync_paths

stacks=()
stack_compose=()
stack_health=()
stack_build_image=()
stack_build_context=()
stack_rollback_images=()
stack_pre_cmd=()
stack_post_cmd=()

while IFS= read -r line || [ -n "$line" ]; do
  line="$(trim "$line")"
  [ -z "$line" ] && continue
  case "$line" in
    \#*) continue ;;
  esac
  IFS='|' read -r name compose_path health_url build_image build_context rollback_images pre_cmd post_cmd <<< "$line"
  name="$(trim "$name")"
  compose_path="$(trim "$compose_path")"
  health_url="$(trim "$health_url")"
  build_image="$(trim "$build_image")"
  build_context="$(trim "$build_context")"
  rollback_images="$(trim "$rollback_images")"
  pre_cmd="$(trim "$pre_cmd")"
  post_cmd="$(trim "$post_cmd")"

  if [ -z "$name" ] || [ -z "$compose_path" ]; then
    log "invalid stack line: $line"
    exit 1
  fi

  stacks+=("$name")
  stack_compose+=("$compose_path")
  stack_health+=("$health_url")
  stack_build_image+=("$build_image")
  stack_build_context+=("$build_context")
  stack_rollback_images+=("$rollback_images")
  stack_pre_cmd+=("$pre_cmd")
  stack_post_cmd+=("$post_cmd")
done < "$STACKS_FILE"

if [ "${#stacks[@]}" -eq 0 ]; then
  log "no stacks configured in $STACKS_FILE"
  exit 1
fi

log "saving rollback images"
for i in "${!stacks[@]}"; do
  name="${stacks[$i]}"
  build_image="${stack_build_image[$i]}"
  rollback_images="${stack_rollback_images[$i]}"

  if [ -n "$rollback_images" ]; then
    IFS=',' read -r -a images <<< "$rollback_images"
    for image in "${images[@]}"; do
      image="$(trim "$image")"
      [ -z "$image" ] && continue
      save_rollback_image "$name" "$image"
    done
  elif [ -n "$build_image" ]; then
    save_rollback_image "$name" "$build_image"
  fi

done

for i in "${!stacks[@]}"; do
  name="${stacks[$i]}"
  compose_path="${stack_compose[$i]}"
  health_url="${stack_health[$i]}"
  build_image="${stack_build_image[$i]}"
  build_context="${stack_build_context[$i]}"
  rollback_images="${stack_rollback_images[$i]}"
  pre_cmd="${stack_pre_cmd[$i]}"
  post_cmd="${stack_post_cmd[$i]}"

  if [ -n "$build_image" ]; then
    if [ -z "$build_context" ]; then
      build_context="$release_dir"
    else
      build_context="$release_dir/$build_context"
    fi
    log "building image $build_image:latest (stack $name)"
    docker build -t "$build_image:latest" "$build_context"
  fi

  compose_file="$release_dir/$compose_path"
  if [ ! -f "$compose_file" ]; then
    log "compose file missing for $name: $compose_file"
    if [ "$ROLLBACK_MODE" = "all" ]; then
      for j in "${!stacks[@]}"; do
        rollback_stack "${stacks[$j]}" "${stack_compose[$j]}" "${stack_build_image[$j]}" "${stack_rollback_images[$j]}"
      done
    else
      rollback_stack "$name" "$compose_path" "$build_image" "$rollback_images"
    fi
    exit 1
  fi

  if [ -n "$pre_cmd" ]; then
    log "pre-deploy for $name"
    bash -lc "$pre_cmd"
  fi

  log "deploying stack $name"
  COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_PREFIX-$name" docker compose \
    -f "$compose_file" \
    --env-file "$SHARED_ENV" \
    up -d --remove-orphans

  if [ -n "$health_url" ]; then
    if ! health_check "$health_url"; then
      log "health check failed for $name"
      if [ "$ROLLBACK_MODE" = "all" ]; then
        for j in "${!stacks[@]}"; do
          rollback_stack "${stacks[$j]}" "${stack_compose[$j]}" "${stack_build_image[$j]}" "${stack_rollback_images[$j]}"
        done
      else
        rollback_stack "$name" "$compose_path" "$build_image" "$rollback_images"
      fi
      exit 1
    fi
  fi

  if [ -n "$post_cmd" ]; then
    log "post-deploy for $name"
    bash -lc "$post_cmd"
  fi

done

ln -sfn "$release_dir" "$DEPLOY_DIR/current"
echo "$sha" > "$DEPLOY_DIR/current.sha"
log "deploy ok: $sha"

log "pruning old releases"
ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +"$((KEEP_RELEASES + 1))" | xargs -r rm -rf
