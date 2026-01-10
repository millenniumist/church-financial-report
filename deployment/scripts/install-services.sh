#!/usr/bin/env bash
###############################################################################
# CC-Financial Services Manager
# 
# This script manages ALL systemd services for the CC-Financial deployment.
# It can install, update, verify, and ensure all services are running properly.
#
# Features:
# - Checks all services and installs/updates if missing or outdated
# - Fail-fast behavior: exits immediately if any critical service fails
# - Validates service health after installation
# - Supports both local and remote (SSH) execution
#
# Usage:
#   ./install-services.sh                    # Install all services
#   ./install-services.sh --check            # Check service status only
#   ./install-services.sh --update           # Force update all services
#   ./install-services.sh --service webhook  # Install specific service
#   ./install-services.sh --remote           # Install on remote Pi
###############################################################################

set -euo pipefail

# ==============================================================================
# Configuration
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GITOPS_DIR="$REPO_ROOT/deployment/gitops"
SCRIPTS_DIR="$REPO_ROOT/deployment/scripts"

# Deployment paths
DEPLOY_DIR="${DEPLOY_DIR:-/srv/cc-financial}"
RUN_USER="${RUN_USER:-$(id -un)}"

# Load remote config if available
DEPLOY_ENV_FILE="$SCRIPT_DIR/../.env.deploy"
REMOTE_HOST=""
REMOTE_USER=""
REMOTE_PASS=""

if [ -f "$DEPLOY_ENV_FILE" ]; then
    # shellcheck disable=SC1090
    source "$DEPLOY_ENV_FILE"
    REMOTE_HOST="${hostIp:-}"
    REMOTE_USER="${username:-}"
    REMOTE_PASS="${password:-}"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Remote mode flag
REMOTE_MODE="${REMOTE_MODE:-false}"

# ==============================================================================
# Service Definitions
# Using regular arrays for bash 3.x compatibility (macOS)
# Format: "name|type|critical|deps|files|scripts"
# ==============================================================================

SERVICE_DEFS=(
    "webhook|service|yes||cc-financial-webhook.service|webhook.py"
    "gitops-poll-dev|both|no||cc-financial-gitops-poll-dev.service,cc-financial-gitops-poll-dev.timer|poll.sh,deploy.sh"
    "gitops-poll-prod|both|no||cc-financial-gitops-poll-prod.service,cc-financial-gitops-poll-prod.timer|poll.sh,deploy.sh"
    "health-monitor|service|no|webhook|cc-financial-health-monitor.service|"
    # Note: cloudflared may be installed as system service 'cloudflared.service' instead
    "cloudflared|service|no||cc-financial-cloudflared.service|"
    "cleanup|both|no||cc-financial-cleanup.service,cc-financial-cleanup.timer|cleanup-images.sh"
)

# ==============================================================================
# Logging Functions
# ==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_fatal() {
    log_error "$*"
    exit 1
}

# ==============================================================================
# Service Definition Parser
# ==============================================================================

get_service_field() {
    local name="$1"
    local field="$2"  # 0=name, 1=type, 2=critical, 3=deps, 4=files, 5=scripts
    
    for def in "${SERVICE_DEFS[@]}"; do
        local svc_name
        svc_name=$(echo "$def" | cut -d'|' -f1)
        if [ "$svc_name" = "$name" ]; then
            echo "$def" | cut -d'|' -f$((field + 1))
            return 0
        fi
    done
    return 1
}

get_all_service_names() {
    for def in "${SERVICE_DEFS[@]}"; do
        echo "$def" | cut -d'|' -f1
    done
}

# ==============================================================================
# Helper Functions
# ==============================================================================

# Execute command locally or remotely based on mode
exec_cmd() {
    local cmd="$1"
    if [ "$REMOTE_MODE" = "true" ]; then
        if [ -n "$REMOTE_PASS" ] && command -v sshpass &>/dev/null; then
            sshpass -p "$REMOTE_PASS" ssh -o StrictHostKeyChecking=no \
                "$REMOTE_USER@$REMOTE_HOST" "$cmd"
        else
            ssh -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "$cmd"
        fi
    else
        bash -c "$cmd"
    fi
}

# Copy file locally or remotely
copy_file() {
    local src="$1"
    local dst="$2"
    
    if [ "$REMOTE_MODE" = "true" ]; then
        if [ -n "$REMOTE_PASS" ] && command -v sshpass &>/dev/null; then
            sshpass -p "$REMOTE_PASS" scp -o StrictHostKeyChecking=no "$src" "$REMOTE_USER@$REMOTE_HOST:$dst"
        else
            scp -o StrictHostKeyChecking=no "$src" "$REMOTE_USER@$REMOTE_HOST:$dst"
        fi
    else
        cp -f "$src" "$dst"
    fi
}

# Check if a service exists
service_exists() {
    local service="$1"
    if [ "$REMOTE_MODE" = "true" ]; then
        exec_cmd "systemctl list-unit-files 2>/dev/null | grep -q '^$service'" 2>/dev/null
    else
        systemctl list-unit-files 2>/dev/null | grep -q "^$service"
    fi
}

# Check if a service is active
service_is_active() {
    local service="$1"
    if [ "$REMOTE_MODE" = "true" ]; then
        exec_cmd "systemctl is-active --quiet $service" 2>/dev/null
    else
        systemctl is-active --quiet "$service" 2>/dev/null
    fi
}

# Check if a service is enabled
service_is_enabled() {
    local service="$1"
    if [ "$REMOTE_MODE" = "true" ]; then
        exec_cmd "systemctl is-enabled --quiet $service" 2>/dev/null
    else
        systemctl is-enabled --quiet "$service" 2>/dev/null
    fi
}

# ==============================================================================
# Service Management Functions
# ==============================================================================

# Install a single systemd unit file
install_unit_file() {
    local file="$1"
    local src_path="$GITOPS_DIR/$file"
    
    if [ ! -f "$src_path" ]; then
        log_error "Unit file not found: $file"
        return 1
    fi
    
    log_info "  Installing unit file: $file"
    
    # Replace __RUN_USER__ placeholder
    local tmp_file="/tmp/$file"
    sed "s|__RUN_USER__|$RUN_USER|g" "$src_path" > "$tmp_file"
    
    if [ "$REMOTE_MODE" = "true" ]; then
        copy_file "$tmp_file" "/tmp/$file"
        exec_cmd "sudo mv /tmp/$file /etc/systemd/system/$file && sudo chmod 644 /etc/systemd/system/$file"
    else
        sudo cp "$tmp_file" "/etc/systemd/system/$file"
        sudo chmod 644 "/etc/systemd/system/$file"
    fi
    
    rm -f "$tmp_file"
    return 0
}

# Install required scripts for a service
install_service_scripts() {
    local service="$1"
    local scripts
    scripts=$(get_service_field "$service" 5) || true
    
    [ -z "$scripts" ] && return 0
    
    IFS=',' read -ra script_list <<< "$scripts"
    for script in "${script_list[@]}"; do
        local src_path
        local dst_path
        
        # Try gitops dir first
        src_path="$GITOPS_DIR/$script"
        dst_path="$DEPLOY_DIR/bin/$script"
        
        if [ ! -f "$src_path" ]; then
            # Try scripts dir
            src_path="$SCRIPTS_DIR/$script"
        fi
        
        if [ -f "$src_path" ]; then
            log_info "    Copying script: $script"
            if [ "$REMOTE_MODE" = "true" ]; then
                copy_file "$src_path" "/tmp/$script"
                exec_cmd "mkdir -p $DEPLOY_DIR/bin && mv /tmp/$script $DEPLOY_DIR/bin/$script && chmod +x $DEPLOY_DIR/bin/$script"
            else
                sudo mkdir -p "$DEPLOY_DIR/bin"
                sudo cp "$src_path" "$DEPLOY_DIR/bin/$script"
                sudo chmod +x "$DEPLOY_DIR/bin/$script"
            fi
        else
            log_warn "    Script not found (may be optional): $script"
        fi
    done
}

# Install a complete service (unit files + scripts)
install_service() {
    local service="$1"
    local force="${2:-false}"
    
    local svc_type svc_critical svc_deps svc_files
    svc_type=$(get_service_field "$service" 1) || { log_error "Unknown service: $service"; return 1; }
    svc_critical=$(get_service_field "$service" 2)
    svc_deps=$(get_service_field "$service" 3)
    svc_files=$(get_service_field "$service" 4)
    
    log_info "Installing service: $service (type=$svc_type, critical=$svc_critical)"
    
    # Check dependencies
    if [ -n "$svc_deps" ]; then
        IFS=',' read -ra dep_list <<< "$svc_deps"
        for dep in "${dep_list[@]}"; do
            local dep_files
            dep_files=$(get_service_field "$dep" 4) || true
            IFS=',' read -ra dep_file_list <<< "$dep_files"
            for dep_file in "${dep_file_list[@]}"; do
                if ! service_is_active "$dep_file" 2>/dev/null; then
                    log_warn "  Dependency not active: $dep_file"
                fi
            done
        done
    fi
    
    # Install unit files
    IFS=',' read -ra file_list <<< "$svc_files"
    for file in "${file_list[@]}"; do
        if ! install_unit_file "$file"; then
            if [ "$svc_critical" = "yes" ]; then
                log_fatal "Failed to install critical unit file: $file"
            else
                log_warn "Failed to install unit file: $file (non-critical)"
                return 1
            fi
        fi
    done
    
    # Install required scripts
    install_service_scripts "$service"
    
    # Reload systemd
    if [ "$REMOTE_MODE" = "true" ]; then
        exec_cmd "sudo systemctl daemon-reload"
    else
        sudo systemctl daemon-reload
    fi
    
    # Enable and start the service/timer
    for file in "${file_list[@]}"; do
        if [[ "$file" == *.timer ]]; then
            log_info "  Enabling timer: $file"
            if [ "$REMOTE_MODE" = "true" ]; then
                exec_cmd "sudo systemctl enable --now $file" || {
                    if [ "$svc_critical" = "yes" ]; then
                        log_fatal "Failed to enable critical timer: $file"
                    fi
                    log_warn "  Failed to enable timer: $file"
                }
            else
                sudo systemctl enable --now "$file" || {
                    if [ "$svc_critical" = "yes" ]; then
                        log_fatal "Failed to enable critical timer: $file"
                    fi
                    log_warn "  Failed to enable timer: $file"
                }
            fi
        elif [[ "$file" == *.service ]] && [[ "$svc_type" != "both" ]]; then
            log_info "  Enabling service: $file"
            if [ "$REMOTE_MODE" = "true" ]; then
                exec_cmd "sudo systemctl enable --now $file" || {
                    if [ "$svc_critical" = "yes" ]; then
                        log_fatal "Failed to enable critical service: $file"
                    fi
                    log_warn "  Failed to enable service: $file"
                }
            else
                sudo systemctl enable --now "$file" || {
                    if [ "$svc_critical" = "yes" ]; then
                        log_fatal "Failed to enable critical service: $file"
                    fi
                    log_warn "  Failed to enable service: $file"
                }
            fi
        fi
    done
    
    log_success "Service installed: $service"
    return 0
}

# Ensure a service is enabled and running (for already-installed services)
ensure_service_running() {
    local service="$1"
    
    local svc_type svc_files
    svc_type=$(get_service_field "$service" 1) || return 1
    svc_files=$(get_service_field "$service" 4) || return 1
    
    IFS=',' read -ra file_list <<< "$svc_files"
    for file in "${file_list[@]}"; do
        # For timer-based services, enable the timer not the service
        if [[ "$file" == *.timer ]]; then
            if ! service_is_enabled "$file" 2>/dev/null; then
                log_info "  Enabling timer: $file"
                if [ "$REMOTE_MODE" = "true" ]; then
                    exec_cmd "sudo systemctl enable $file" || log_warn "  Failed to enable $file"
                else
                    sudo systemctl enable "$file" || log_warn "  Failed to enable $file"
                fi
            fi
            if ! service_is_active "$file" 2>/dev/null; then
                log_info "  Starting timer: $file"
                if [ "$REMOTE_MODE" = "true" ]; then
                    exec_cmd "sudo systemctl start $file" || log_warn "  Failed to start $file"
                else
                    sudo systemctl start "$file" || log_warn "  Failed to start $file"
                fi
            fi
        elif [[ "$file" == *.service ]] && [[ "$svc_type" != "both" ]]; then
            # Regular service (not timer-triggered)
            if ! service_is_enabled "$file" 2>/dev/null; then
                log_info "  Enabling service: $file"
                if [ "$REMOTE_MODE" = "true" ]; then
                    exec_cmd "sudo systemctl enable $file" || log_warn "  Failed to enable $file"
                else
                    sudo systemctl enable "$file" || log_warn "  Failed to enable $file"
                fi
            fi
            if ! service_is_active "$file" 2>/dev/null; then
                log_info "  Starting service: $file"
                if [ "$REMOTE_MODE" = "true" ]; then
                    exec_cmd "sudo systemctl start $file" || log_warn "  Failed to start $file"
                else
                    sudo systemctl start "$file" || log_warn "  Failed to start $file"
                fi
            fi
        fi
    done
}

# Check and report status of all services
check_all_services() {
    local full="${1:-false}"
    
    log_info "Checking status of all services..."
    echo ""
    
    local all_ok=true
    
    printf "%-45s %-12s %-10s %-10s\n" "SERVICE" "STATUS" "ENABLED" "CRITICAL"
    printf "%s\n" "-------------------------------------------------------------------------------"
    
    for def in "${SERVICE_DEFS[@]}"; do
        local svc_name svc_critical svc_files
        svc_name=$(echo "$def" | cut -d'|' -f1)
        svc_critical=$(echo "$def" | cut -d'|' -f3)
        svc_files=$(echo "$def" | cut -d'|' -f5)
        
        IFS=',' read -ra file_list <<< "$svc_files"
        for file in "${file_list[@]}"; do
            local status enabled crit_display
            
            if service_is_active "$file" 2>/dev/null; then
                status="${GREEN}active${NC}"
            elif service_exists "$file" 2>/dev/null; then
                status="${YELLOW}inactive${NC}"
                [ "$svc_critical" = "yes" ] && all_ok=false
            else
                status="${RED}missing${NC}"
                # Only fail if critical, unless it's cloudflared which might have alternate name
                if [ "$svc_critical" = "yes" ]; then
                    all_ok=false
                fi
            fi
            
            if service_is_enabled "$file" 2>/dev/null; then
                enabled="${GREEN}yes${NC}"
            else
                enabled="${RED}no${NC}"
            fi
            
            [ "$svc_critical" = "yes" ] && crit_display="${RED}YES${NC}" || crit_display="no"
            
            printf "%-45s %-22b %-20b %-20b\n" "$file" "$status" "$enabled" "$crit_display"
        done
    done
    
    # Also check base cloudflared.service (alternate installation)
    echo ""
    log_info "Other important services:"
    printf "%s\n" "-------------------------------------------------------------------------------"
    
    # Check cloudflared.service (system-level installation)
    local cf_status cf_enabled
    if service_is_active "cloudflared.service" 2>/dev/null; then
        cf_status="${GREEN}active${NC}"
    elif service_exists "cloudflared.service" 2>/dev/null; then
        cf_status="${YELLOW}inactive${NC}"
    else
        cf_status="${RED}missing${NC}"
    fi
    if service_is_enabled "cloudflared.service" 2>/dev/null; then
        cf_enabled="${GREEN}yes${NC}"
    else
        cf_enabled="${RED}no${NC}"
    fi
    printf "%-45s %-22b %-20b %-20b\n" "cloudflared.service (system)" "$cf_status" "$cf_enabled" "YES"
    
    # If full mode, also check Docker containers
    if [ "$full" = "true" ]; then
        echo ""
        log_info "Docker containers:"
        printf "%s\n" "-------------------------------------------------------------------------------"
        printf "%-30s %-12s %-20s\n" "CONTAINER" "STATUS" "PORTS"
        printf "%s\n" "-------------------------------------------------------------------------------"
        
        local docker_output
        if [ "$REMOTE_MODE" = "true" ]; then
            docker_output=$(exec_cmd "docker ps --format '{{.Names}}|{{.Status}}|{{.Ports}}' 2>/dev/null" || echo "")
        else
            docker_output=$(docker ps --format '{{.Names}}|{{.Status}}|{{.Ports}}' 2>/dev/null || echo "")
        fi
        
        if [ -n "$docker_output" ]; then
            echo "$docker_output" | while IFS='|' read -r name status ports; do
                local st="${GREEN}$status${NC}"
                printf "%-30s %-22b %s\n" "$name" "$st" "$ports"
            done
        else
            echo "  No containers running"
        fi
        
        # Check expected containers
        local expected_containers="nextjs-app nextjs-app-prod"
        echo ""
        log_info "Expected containers check:"
        for container in $expected_containers; do
            local running
            if [ "$REMOTE_MODE" = "true" ]; then
                running=$(exec_cmd "docker ps --filter name=$container --format '{{.Names}}' 2>/dev/null" || echo "")
            else
                running=$(docker ps --filter name="$container" --format '{{.Names}}' 2>/dev/null || echo "")
            fi
            
            if [ -n "$running" ]; then
                echo -e "  ${GREEN}✓${NC} $container is running"
            else
                echo -e "  ${YELLOW}○${NC} $container is not running"
            fi
        done
    fi
    
    echo ""
    
    if [ "$all_ok" = true ]; then
        log_success "All critical services are properly configured!"
        return 0
    else
        log_warn "Some services need attention"
        return 1
    fi
}

# Install all missing or outdated services
install_all_services() {
    local force="${1:-false}"
    
    log_info "Installing all services..."
    
    # Ensure directories exist
    if [ "$REMOTE_MODE" = "true" ]; then
        exec_cmd "sudo mkdir -p $DEPLOY_DIR/{bin,logs,releases,shared,rollbacks,cloudflare}"
        exec_cmd "sudo chown -R $RUN_USER:$RUN_USER $DEPLOY_DIR"
    else
        sudo mkdir -p "$DEPLOY_DIR"/{bin,logs,releases,shared,rollbacks,cloudflare}
        sudo chown -R "$RUN_USER":"$RUN_USER" "$DEPLOY_DIR"
    fi
    
    local failed_services=""
    local critical_failed=false
    
    for def in "${SERVICE_DEFS[@]}"; do
        local svc_name svc_critical svc_files
        svc_name=$(echo "$def" | cut -d'|' -f1)
        svc_critical=$(echo "$def" | cut -d'|' -f3)
        svc_files=$(echo "$def" | cut -d'|' -f5)
        
        # Check if installation needed
        local need_install=false
        if [ "$force" = "true" ]; then
            need_install=true
        else
            IFS=',' read -ra file_list <<< "$svc_files"
            for file in "${file_list[@]}"; do
                if ! service_exists "$file" 2>/dev/null; then
                    need_install=true
                    break
                fi
            done
        fi
        
        if [ "$need_install" = "true" ]; then
            if ! install_service "$svc_name" "$force"; then
                failed_services="$failed_services $svc_name"
                [ "$svc_critical" = "yes" ] && critical_failed=true
            fi
        else
            log_info "Service already installed: $svc_name"
            # Ensure the service is enabled and started even if already installed
            ensure_service_running "$svc_name"
        fi
    done
    
    echo ""
    
    if [ "$critical_failed" = "true" ]; then
        log_fatal "Critical service installation failed! Aborting."
    fi
    
    if [ -n "$failed_services" ]; then
        log_warn "Some non-critical services failed:$failed_services"
    else
        log_success "All services installed successfully!"
    fi
    
    # Show final status
    echo ""
    check_all_services
}

# Verify all services are healthy
verify_services() {
    log_info "Verifying service health..."
    
    local unhealthy=""
    local critical_unhealthy=false
    
    for def in "${SERVICE_DEFS[@]}"; do
        local svc_name svc_type svc_critical svc_files
        svc_name=$(echo "$def" | cut -d'|' -f1)
        svc_type=$(echo "$def" | cut -d'|' -f2)
        svc_critical=$(echo "$def" | cut -d'|' -f3)
        svc_files=$(echo "$def" | cut -d'|' -f5)
        
        IFS=',' read -ra file_list <<< "$svc_files"
        for file in "${file_list[@]}"; do
            # Skip timer files for active check (they may not run continuously)
            [[ "$file" == *.timer ]] && continue
            
            if ! service_is_active "$file" 2>/dev/null; then
                unhealthy="$unhealthy $file"
                if [ "$svc_critical" = "yes" ]; then
                    log_error "Critical service is unhealthy: $file"
                    critical_unhealthy=true
                fi
            fi
        done
    done
    
    if [ "$critical_unhealthy" = "true" ]; then
        log_fatal "Critical services are unhealthy! Services:$unhealthy"
    fi
    
    if [ -n "$unhealthy" ]; then
        log_warn "Unhealthy services:$unhealthy"
        return 1
    else
        log_success "All services are healthy!"
        return 0
    fi
}

# ==============================================================================
# Main
# ==============================================================================

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Manages ALL systemd services for CC-Financial deployment."
    echo ""
    echo "Options:"
    echo "  --check           Check status of all services (don't install)"
    echo "  --full            Include Docker containers in check (use with --check)"
    echo "  --update          Force update/reinstall all services"
    echo "  --verify          Verify all services are healthy (fail if critical service down)"
    echo "  --service NAME    Install only the specified service"
    echo "  --remote          Execute on remote Pi (uses .env.deploy)"
    echo "  --user USER       Override the run user (default: current user)"
    echo "  --help            Show this help message"
    echo ""
    echo "Services managed by this script:"
    for def in "${SERVICE_DEFS[@]}"; do
        local svc_name svc_type svc_critical
        svc_name=$(echo "$def" | cut -d'|' -f1)
        svc_type=$(echo "$def" | cut -d'|' -f2)
        svc_critical=$(echo "$def" | cut -d'|' -f3)
        echo "  - $svc_name (type=$svc_type, critical=$svc_critical)"
    done
    echo ""
    echo "Examples:"
    echo "  $0                            # Install all missing services locally"
    echo "  $0 --remote                   # Install all missing services on remote Pi"
    echo "  $0 --remote --update          # Force reinstall all services on remote Pi"
    echo "  $0 --remote --check           # Check status of services on remote Pi"
    echo "  $0 --remote --check --full    # Full check including Docker containers"
    echo "  $0 --verify                   # Verify all services are healthy (for CI/monitoring)"
}

# ==============================================================================
# Interactive Menu
# ==============================================================================

show_menu() {
    local options=(
        "Check Status (Remote Pi)"
        "Check Status (Local)"
        "Install All Services (Remote Pi)"
        "Install All Services (Local)"
        "Verify Health (Remote Pi)"
        "Check Status Full (Remote Pi)"
        "Exit"
    )
    local selected=0
    local key=""

    # Hide cursor
    echo -ne "\033[?25l"
    
    # Restore cursor on exit
    trap 'echo -ne "\033[?25h"; exit 0' SIGINT SIGTERM EXIT

    while true; do
        clear
        log_info "CC-Financial Services Manager - Interactive Mode"
        echo "Use arrow keys (or j/k) to select an option and Enter to confirm."
        echo ""

        for i in "${!options[@]}"; do
            if [ $i -eq $selected ]; then
                echo -e "${GREEN}> ${options[$i]}${NC}"
            else
                echo -e "  ${options[$i]}"
            fi
        done

        # Read specific key presses
        read -rsn1 key 2>/dev/null || true
        
        # Handle escape sequences for arrow keys
        if [[ "$key" == $'\x1b' ]]; then
            key_extra=""
            # Using -t 1 because macOS bash 3.2 doesn't support fractional timeouts like 0.1
            read -rsn2 -t 1 key_extra 2>/dev/null || true
            # Support both [A (ANSI) and OA (Application) modes for arrows
            if [[ "$key_extra" == "[A" || "$key_extra" == "OA" ]]; then # Up Arrow
                ((selected--))
                if [ $selected -lt 0 ]; then selected=$((${#options[@]} - 1)); fi
            elif [[ "$key_extra" == "[B" || "$key_extra" == "OB" ]]; then # Down Arrow
                ((selected++))
                if [ $selected -ge ${#options[@]} ]; then selected=0; fi
            fi
        # Vim keys
        elif [[ "$key" == "k" ]]; then # Up
            ((selected--))
            if [ $selected -lt 0 ]; then selected=$((${#options[@]} - 1)); fi
        elif [[ "$key" == "j" ]]; then # Down
            ((selected++))
            if [ $selected -ge ${#options[@]} ]; then selected=0; fi
        elif [[ "$key" == "" ]]; then # Enter key
            echo -ne "\033[?25h" # Show cursor
            echo ""
            case $selected in
                0) # Check Remote
                    REMOTE_MODE="true"
                    if [ -z "$REMOTE_HOST" ]; then
                        log_fatal "Remote mode requires .env.deploy with hostIp configured"
                    fi
                    [ -n "$REMOTE_USER" ] && RUN_USER="$REMOTE_USER"
                    check_all_services "false"
                    read -rp "Press Enter to continue..."
                    ;;
                1) # Check Local
                    REMOTE_MODE="false"
                    check_all_services "false"
                    read -rp "Press Enter to continue..."
                    ;;
                2) # Install Remote
                    REMOTE_MODE="true"
                     if [ -z "$REMOTE_HOST" ]; then
                        log_fatal "Remote mode requires .env.deploy with hostIp configured"
                    fi
                    [ -n "$REMOTE_USER" ] && RUN_USER="$REMOTE_USER"
                    install_all_services "false"
                    read -rp "Press Enter to continue..."
                    ;;
                3) # Install Local
                    REMOTE_MODE="false"
                    install_all_services "false"
                    read -rp "Press Enter to continue..."
                    ;;
                4) # Verify Remote
                    REMOTE_MODE="true"
                     if [ -z "$REMOTE_HOST" ]; then
                        log_fatal "Remote mode requires .env.deploy with hostIp configured"
                    fi
                    [ -n "$REMOTE_USER" ] && RUN_USER="$REMOTE_USER"
                    verify_services
                    read -rp "Press Enter to continue..."
                    ;;
                5) # Check Full Remote
                    REMOTE_MODE="true"
                     if [ -z "$REMOTE_HOST" ]; then
                        log_fatal "Remote mode requires .env.deploy with hostIp configured"
                    fi
                    [ -n "$REMOTE_USER" ] && RUN_USER="$REMOTE_USER"
                    check_all_services "true"
                    read -rp "Press Enter to continue..."
                    ;;
                6) # Exit
                    exit 0
                    ;;
            esac
            # Hide cursor again for menu
            echo -ne "\033[?25l"
        fi
    done
}

main() {
    # If no arguments provided, show interactive menu
    if [[ $# -eq 0 ]]; then
        show_menu
        exit 0
    fi

    local action="install"
    local force=false
    local full_check=false
    local target_service=""
    local user_provided=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --check)
                action="check"
                shift
                ;;
            --full)
                full_check=true
                shift
                ;;
            --update)
                force=true
                shift
                ;;
            --verify)
                action="verify"
                shift
                ;;
            --service)
                target_service="$2"
                shift 2
                ;;
            --remote)
                REMOTE_MODE="true"
                if [ -z "$REMOTE_HOST" ]; then
                    log_fatal "Remote mode requires .env.deploy with hostIp configured"
                fi
                shift
                ;;
            --user)
                RUN_USER="$2"
                user_provided=true
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Auto-switch user for remote mode if not explicitly provided
    if [ "$REMOTE_MODE" = "true" ] && [ "$user_provided" = "false" ] && [ -n "$REMOTE_USER" ]; then
        RUN_USER="$REMOTE_USER"
    fi
    
    log_info "CC-Financial Services Manager"
    log_info "=============================="
    log_info "Deploy Directory: $DEPLOY_DIR"
    log_info "Run User: $RUN_USER"
    log_info "Remote Mode: $REMOTE_MODE"
    [ "$REMOTE_MODE" = "true" ] && [ -n "$REMOTE_HOST" ] && log_info "Remote Host: $REMOTE_HOST"
    echo ""
    
    case "$action" in
        check)
            check_all_services "$full_check"
            ;;
        verify)
            verify_services
            ;;
        install)
            if [ -n "$target_service" ]; then
                install_service "$target_service" "$force"
            else
                install_all_services "$force"
            fi
            ;;
    esac
}

main "$@"
