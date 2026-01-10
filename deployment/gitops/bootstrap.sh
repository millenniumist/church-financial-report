#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/srv/cc-financial}"
REPO_URL="${REPO_URL:-https://github.com/millenniumist/church-financial-report.git}"
BRANCH="${BRANCH:-main}"
RUN_USER="${RUN_USER:-$(id -un)}"
INSTALL_DOCKER="${INSTALL_DOCKER:-true}"
INSTALL_CLOUDFLARED="${INSTALL_CLOUDFLARED:-true}"
ENABLE_WEBHOOK_SERVICE="${ENABLE_WEBHOOK_SERVICE:-true}"
ENABLE_GITOPS_POLL_TIMER="${ENABLE_GITOPS_POLL_TIMER:-true}"
ENABLE_HEALTH_MONITOR_SERVICE="${ENABLE_HEALTH_MONITOR_SERVICE:-false}"
ENABLE_CLOUDFLARED_SERVICE="${ENABLE_CLOUDFLARED_SERVICE:-false}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

require_sudo() {
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required" >&2
    exit 1
  fi
  sudo -v
}

install_packages() {
  log "installing base packages"
  sudo apt-get update
  sudo apt-get install -y git curl ca-certificates python3 python3-venv jq
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "docker already installed"
    return
  fi
  log "installing docker"
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$RUN_USER"
}

install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    log "cloudflared already installed"
    return
  fi

  arch="$(uname -m)"
  case "$arch" in
    aarch64|arm64) pkg="cloudflared-linux-arm64.deb" ;;
    armv7l|armv6l) pkg="cloudflared-linux-arm.deb" ;;
    x86_64|amd64) pkg="cloudflared-linux-amd64.deb" ;;
    *)
      echo "unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  log "installing cloudflared ($pkg)"
  tmp="/tmp/$pkg"
  curl -fsSL -o "$tmp" "https://github.com/cloudflare/cloudflared/releases/latest/download/$pkg"
  sudo dpkg -i "$tmp"
}

setup_dirs() {
  log "creating $DEPLOY_DIR layout"
  sudo mkdir -p "$DEPLOY_DIR"/{bin,releases,shared,logs,rollbacks,cloudflare}
  sudo mkdir -p "$DEPLOY_DIR/shared/content"
  sudo chown -R "$RUN_USER":"$RUN_USER" "$DEPLOY_DIR"
}

install_gitops_files() {
  log "installing GitOps scripts"
  install -m 0755 "$REPO_ROOT/deployment/gitops/deploy.sh" "$DEPLOY_DIR/bin/deploy.sh"
  install -m 0755 "$REPO_ROOT/deployment/gitops/webhook.py" "$DEPLOY_DIR/bin/webhook.py"
  install -m 0755 "$REPO_ROOT/deployment/gitops/poll.sh" "$DEPLOY_DIR/bin/poll.sh"
  install -m 0755 "$REPO_ROOT/deployment/gitops/watch-deploy.sh" "$DEPLOY_DIR/bin/watch-deploy.sh"

  if [ ! -f "$DEPLOY_DIR/shared/gitops.env" ]; then
    secret="$(python3 - <<'PY'\nimport secrets\nprint(secrets.token_hex(32))\nPY\n)"
    sed "s|^WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$secret|" \
      "$REPO_ROOT/deployment/gitops/gitops.env.example" > "$DEPLOY_DIR/shared/gitops.env"
    log "generated webhook secret: $secret"
  fi

  if [ ! -f "$DEPLOY_DIR/shared/stacks.conf" ]; then
    cp "$REPO_ROOT/deployment/gitops/stacks.conf.example" "$DEPLOY_DIR/shared/stacks.conf"
  fi

  if [ ! -f "$DEPLOY_DIR/shared/.env" ]; then
    log "missing app env at $DEPLOY_DIR/shared/.env (copy your production env here)"
  fi
}

install_services() {
  if [ "$ENABLE_WEBHOOK_SERVICE" = "true" ]; then
    log "installing webhook service"
    sed "s|__RUN_USER__|$RUN_USER|g" \
      "$REPO_ROOT/deployment/gitops/cc-financial-webhook.service" | \
      sudo tee /etc/systemd/system/cc-financial-webhook.service >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl enable --now cc-financial-webhook
  fi


  if [ "$ENABLE_GITOPS_POLL_TIMER" = "true" ]; then
    log "installing gitops poll timers (dev & prod)"
    
    # Dev
    sed "s|__RUN_USER__|$RUN_USER|g" \
      "$REPO_ROOT/deployment/gitops/cc-financial-gitops-poll-dev.service" | \
      sudo tee /etc/systemd/system/cc-financial-gitops-poll-dev.service >/dev/null
    sudo install -m 0644 "$REPO_ROOT/deployment/gitops/cc-financial-gitops-poll-dev.timer" \
      /etc/systemd/system/cc-financial-gitops-poll-dev.timer
    sudo systemctl enable --now cc-financial-gitops-poll-dev.timer

    # Prod
    sed "s|__RUN_USER__|$RUN_USER|g" \
      "$REPO_ROOT/deployment/gitops/cc-financial-gitops-poll-prod.service" | \
      sudo tee /etc/systemd/system/cc-financial-gitops-poll-prod.service >/dev/null
    sudo install -m 0644 "$REPO_ROOT/deployment/gitops/cc-financial-gitops-poll-prod.timer" \
      /etc/systemd/system/cc-financial-gitops-poll-prod.timer
    sudo systemctl enable --now cc-financial-gitops-poll-prod.timer
    
    # Disable old service if exists
    sudo systemctl disable --now cc-financial-gitops-poll.timer || true
    
    sudo systemctl daemon-reload
  fi

  if [ "$ENABLE_HEALTH_MONITOR_SERVICE" = "true" ]; then
    log "installing health monitor service"
    sed "s|__RUN_USER__|$RUN_USER|g" \
      "$REPO_ROOT/deployment/gitops/cc-financial-health-monitor.service" | \
      sudo tee /etc/systemd/system/cc-financial-health-monitor.service >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl enable --now cc-financial-health-monitor
  fi

  if [ "$ENABLE_CLOUDFLARED_SERVICE" = "true" ]; then
    log "installing cloudflared service"
    sed "s|__RUN_USER__|$RUN_USER|g" \
      "$REPO_ROOT/deployment/gitops/cc-financial-cloudflared.service" | \
      sudo tee /etc/systemd/system/cc-financial-cloudflared.service >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl enable --now cc-financial-cloudflared
  fi
}

setup_cloudflared_config() {
  if [ ! -f "$DEPLOY_DIR/cloudflare/config.yml" ]; then
    cp "$REPO_ROOT/deployment/cloudflare/config.example.yml" "$DEPLOY_DIR/cloudflare/config.yml"
    log "created $DEPLOY_DIR/cloudflare/config.yml (update with your tunnel credentials)"
  fi

  if [ ! -f "$DEPLOY_DIR/shared/cloudflared.env" ]; then
    cp "$REPO_ROOT/deployment/gitops/cloudflared.env.example" "$DEPLOY_DIR/shared/cloudflared.env"
    log "created $DEPLOY_DIR/shared/cloudflared.env (set TUNNEL_NAME)"
  fi
}

require_sudo
install_packages

if [ "$INSTALL_DOCKER" = "true" ]; then
  install_docker
fi

if [ "$INSTALL_CLOUDFLARED" = "true" ]; then
  install_cloudflared
fi

setup_dirs
install_gitops_files
setup_cloudflared_config
install_services

log "bootstrap complete"
log "next steps:"
log "- populate $DEPLOY_DIR/shared/.env"
log "- update $DEPLOY_DIR/shared/stacks.conf for your services"
log "- update $DEPLOY_DIR/cloudflare/config.yml and add DNS route if using tunnel"
log "- test deploy: set -a; source $DEPLOY_DIR/shared/gitops.env; set +a; $DEPLOY_DIR/bin/deploy.sh"
