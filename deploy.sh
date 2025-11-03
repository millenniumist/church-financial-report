#!/usr/bin/env bash
# Deploy cc-financial locally or to a remote host over SSH.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PORT="${APP_PORT:-3000}"

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  -e, --env-file <file>     Environment file to supply to docker compose (default: .env)
  -l, --local               Deploy on this machine (default if you choose option 1 when prompted)
  -r, --remote <user@host:/path>
                            Deploy to a remote host over SSH and run docker compose there
  -h, --help                Show this help message

If no target is specified, you will be prompted to choose local or remote deployment.
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

select_target() {
  if [[ -n "$TARGET" ]]; then
    return
  fi

  echo "Select deployment target:"
  echo "  1) Local Docker (this machine)"
  echo "  2) Remote over SSH"
  read -rp "Enter choice [1/2]: " choice
  case "${choice:-1}" in
    1) TARGET="local" ;;
    2) TARGET="remote" ;;
    *) die "Invalid choice '${choice}'" ;;
  esac
}

ENV_FILE=".env"
ENV_FILE_PROVIDED=false
TARGET=""
REMOTE_SPEC=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env-file)
      [[ $# -lt 2 ]] && die "Missing argument for $1"
      ENV_FILE="$2"
      ENV_FILE_PROVIDED=true
      shift 2
      ;;
    -l|--local)
      TARGET="local"
      shift
      ;;
    -r|--remote)
      [[ $# -lt 2 ]] && die "Missing argument for $1"
      TARGET="remote"
      REMOTE_SPEC="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

select_target

if [[ "$ENV_FILE_PROVIDED" == false ]] && [[ "$ENV_FILE" == ".env" ]] && [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]] && [[ -f "$PROJECT_ROOT/.env.local" ]]; then
  ENV_FILE=".env.local"
  echo "ℹ️  Using .env.local for deployment (no .env found)."
fi

ENV_PATH="$PROJECT_ROOT/$ENV_FILE"
[[ -f "$ENV_PATH" ]] || die "Environment file '$ENV_FILE' not found in project root. Create it (for example, cp .env.example $ENV_FILE)."

# Ensure docker compose finds a default .env if we're using a different file.
if [[ "$ENV_FILE" != ".env" ]]; then
  if [[ ! -e "$PROJECT_ROOT/.env" ]]; then
    (
      cd "$PROJECT_ROOT"
      ln -s "$ENV_FILE" .env
    )
  fi
fi

# Load environment variables from the chosen file for validation.
set -a
# shellcheck disable=SC1090
source "$ENV_PATH"
set +a

REQUIRED_VARS=("DATABASE_URL" "GOOGLE_SHEETS_SPREADSHEET_ID")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    MISSING_VARS+=("$var")
  fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
  echo "The following required variables are missing or empty in '$ENV_FILE': ${MISSING_VARS[*]}" >&2
  exit 1
fi

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "Required command '$1' is not installed."
  fi
}

check_local_port() {
  local port="$1"

  # Check Docker containers using this port
  local container_lines
  container_lines="$(docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' | grep -E ":${port}->" || true)"
  if [[ -n "$container_lines" ]]; then
    echo "Port $port is currently used by these Docker container(s):"
    printf '%s\n' "$container_lines"
    read -rp "Stop these container(s) now? [y/N]: " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      local container_ids
      container_ids="$(echo "$container_lines" | awk '{print $1}' | awk '!seen[$1]++' | xargs)"
      if [[ -n "$container_ids" ]]; then
        docker stop $container_ids >/dev/null || true
        echo "Stopped container(s): $container_ids"
      fi
    else
      die "Port $port must be free to continue."
    fi
  fi

  if command -v lsof >/dev/null 2>&1; then
    local lsof_output
    lsof_output="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tail -n +2 || true)"
    if [[ -n "$lsof_output" ]]; then
      echo "Port $port is in use by the following process(es):"
      printf '%s\n' "$lsof_output"
      read -rp "Attempt to terminate these process(es)? [y/N]: " kill_answer
      if [[ "$kill_answer" =~ ^[Yy]$ ]]; then
        local pids
        pids="$(echo "$lsof_output" | awk '{print $2}' | awk '!seen[$1]++' | xargs)"
        if [[ -n "$pids" ]]; then
          kill -TERM $pids >/dev/null 2>&1 || true
          sleep 1
          # Check if still running
          local still_running
          still_running="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tail -n +2 || true)"
          if [[ -n "$still_running" ]]; then
            echo "Processes still present, sending SIGKILL..."
            kill -KILL $pids >/dev/null 2>&1 || true
            sleep 1
            still_running="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | tail -n +2 || true)"
            if [[ -n "$still_running" ]]; then
              die "Unable to free port $port automatically. Please resolve manually and rerun."
            fi
          fi
          echo "Port $port freed."
        fi
      else
        die "Port $port must be free to continue."
      fi
    fi
  fi
}

if [[ "$TARGET" == "local" ]]; then
  require_command docker
  if ! docker compose version >/dev/null 2>&1; then
    die "Docker Compose v2 is required (the 'docker compose' plugin)."
  fi

  check_local_port "$APP_PORT"

  echo "🚀 Deploying cc-financial locally using environment file '$ENV_FILE'..."
  (
    cd "$PROJECT_ROOT"
    docker compose --env-file "$ENV_PATH" up -d --build
    echo "✅ Containers are up. Current status:"
    docker compose --env-file "$ENV_PATH" ps
  )
  cat <<'EOF'

Next steps:
  - docker compose logs -f        # Follow logs
  - docker compose down           # Stop services

EOF
  exit 0
fi

# Remote deployment
require_command ssh
require_command rsync

if [[ -z "$REMOTE_SPEC" ]]; then
  read -rp "Enter remote destination (user@host:/absolute/path): " REMOTE_SPEC
fi

[[ "$REMOTE_SPEC" == *:* ]] || die "Remote spec must be in the form user@host:/absolute/path"

REMOTE_HOST="${REMOTE_SPEC%%:*}"
REMOTE_DIR="${REMOTE_SPEC#*:}"
[[ -n "$REMOTE_HOST" ]] || die "Remote host is empty."
[[ "$REMOTE_DIR" == /* ]] || die "Remote path must be absolute."

echo "🚀 Deploying cc-financial to '$REMOTE_HOST' at '$REMOTE_DIR' using environment file '$ENV_FILE'..."

SSH_CONTROL_DIR="${HOME}/.ssh"
mkdir -p "$SSH_CONTROL_DIR"
CONTROL_SOCKET="${SSH_CONTROL_DIR}/cc-financial-$$.sock"
SSH_BASE_OPTS=(-o ControlMaster=auto -o ControlPersist=60 -o ControlPath="$CONTROL_SOCKET")

cleanup() {
  if [[ -S "$CONTROL_SOCKET" ]]; then
    ssh -S "$CONTROL_SOCKET" "$REMOTE_HOST" -O exit >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Start multiplexed connection (prompts for password once)
ssh -MNf "${SSH_BASE_OPTS[@]}" "$REMOTE_HOST"

ssh "${SSH_BASE_OPTS[@]}" "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"

RSYNC_EXCLUDES=(
  "--exclude=.git"
  "--exclude=node_modules"
  "--exclude=.next"
  "--exclude=logs"
  "--exclude=coverage"
  "--exclude=.vercel"
)

rsync -az --delete "${RSYNC_EXCLUDES[@]}" -e "ssh -o ControlPath=$CONTROL_SOCKET" "$PROJECT_ROOT/" "$REMOTE_HOST:$REMOTE_DIR/"

ssh "${SSH_BASE_OPTS[@]}" "$REMOTE_HOST" "cd '$REMOTE_DIR' && docker compose --env-file '$ENV_FILE' up -d --build"

echo "✅ Remote containers are up. Current status:"
ssh "${SSH_BASE_OPTS[@]}" "$REMOTE_HOST" "cd '$REMOTE_DIR' && docker compose --env-file '$ENV_FILE' ps"

cat <<'EOF'

Remote next steps:
  - ssh user@host "cd /path && docker compose logs -f"
  - ssh user@host "cd /path && docker compose down"

EOF
