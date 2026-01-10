#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/srv/cc-financial}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
BRANCH="${BRANCH:-main}"
LOG_DIR="${LOG_DIR:-$DEPLOY_DIR/logs}"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$LOG_DIR/poll.log"
}


ENVIRONMENT="${ENVIRONMENT:-}"
if [ -n "$ENVIRONMENT" ]; then
  SHA_FILE="${SHA_FILE:-$DEPLOY_DIR/$ENVIRONMENT/current.sha}"
else
  SHA_FILE="${SHA_FILE:-$DEPLOY_DIR/current.sha}"
fi

current_sha="$(cat "$SHA_FILE" 2>/dev/null || true)"
remote_sha="$(git ls-remote "$REPO_URL" "refs/heads/$BRANCH" | awk '{print $1}')"

if [ -z "$remote_sha" ]; then
  log "failed to fetch remote sha"
  exit 0
fi

remote_short="${remote_sha:0:7}"

if [ "$remote_short" = "$current_sha" ]; then
  log "no changes ($remote_short)"
  exit 0
fi

log "new commit detected: $remote_short (current: $current_sha)"
export SKIP_BUILD=true
"$DEPLOY_DIR/bin/deploy.sh"
