#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=""
INTERVAL="2"

# Parse arguments properly
while [[ $# -gt 0 ]]; do
  case $1 in
    dev|prod)
      ENVIRONMENT="$1"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        INTERVAL="$1"
      else
        echo "Unknown argument: $1"
      fi
      shift
      ;;
  esac
done

if [ -n "$ENVIRONMENT" ]; then
  LOG="${LOG:-/srv/cc-financial/$ENVIRONMENT/logs/deploy.log}"
  BUILD_LOG="${BUILD_LOG:-/srv/cc-financial/$ENVIRONMENT/logs/build.log}"
  SHA="${SHA:-/srv/cc-financial/$ENVIRONMENT/current.sha}"
else
  LOG="${LOG:-/srv/cc-financial/logs/deploy.log}"
  BUILD_LOG="${BUILD_LOG:-/srv/cc-financial/logs/build.log}"
  SHA="${SHA:-/srv/cc-financial/current.sha}"
fi

while true; do
  clear
  date
  echo "current sha: $(cat "$SHA" 2>/dev/null || echo "n/a")"

  if [ -f "$BUILD_LOG" ]; then
    step=$(grep -Eo '\[[^]]+ [0-9]+/[0-9]+\]' "$BUILD_LOG" | tail -n 1 || true)
    if [ -n "$step" ]; then
      nums=$(echo "$step" | sed -E "s/.* ([0-9]+)\/([0-9]+).*/\1 \2/")
      read -r current total <<< "$nums"
      if [ -n "$total" ] && [ "$total" -gt 0 ]; then
        pct=$(( current * 100 / total ))
        echo "build progress: ${pct}% (step ${current}/${total})"
      fi
    fi
    echo "---- build log (last 20 lines) ----"
    tail -n 20 "$BUILD_LOG" 2>/dev/null || true
  fi

  echo "---- deploy log (last 40 lines) ----"
  tail -n 40 "$LOG" 2>/dev/null || echo "deploy.log not found"
  sleep "$INTERVAL"
done
