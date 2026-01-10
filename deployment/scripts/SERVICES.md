# CC-Financial Services Manager

A comprehensive script to manage all systemd services for the CC-Financial deployment on Raspberry Pi.

## Overview

The `install-services.sh` script automates the installation, update, and verification of all systemd services required for the CC-Financial deployment. It supports both local and remote (SSH) execution.

## Services Managed

| Service | Type | Critical | Description |
|---------|------|----------|-------------|
| `cc-financial-webhook` | service | YES | GitOps webhook server (receives GitHub webhooks) |
| `cc-financial-gitops-poll-dev` | service+timer | no | GitOps polling for dev branch |
| `cc-financial-gitops-poll-prod` | service+timer | no | GitOps polling for prod branch |
| `cc-financial-health-monitor` | service | no | Health monitor with MQTT/Discord alerts |
| `cc-financial-cloudflared` | service | no | Cloudflare tunnel (alternative to system-level cloudflared) |
| `cc-financial-cleanup` | service+timer | no | Docker image cleanup (runs daily at 3 AM) |

> **Note:** The system may also have `cloudflared.service` installed at the system level, which serves the same purpose as `cc-financial-cloudflared.service`.

## Usage

### Check Service Status

```bash
# Check status of all services on remote Pi
./deployment/scripts/install-services.sh --remote --check

# Full check including Docker containers
./deployment/scripts/install-services.sh --remote --check --full
```

### Install Missing Services

```bash
# Install all missing services on remote Pi
./deployment/scripts/install-services.sh --remote

# Force reinstall all services
./deployment/scripts/install-services.sh --remote --update

# Install a specific service
./deployment/scripts/install-services.sh --remote --service webhook
```

### Verify Service Health

```bash
# Verify all services are healthy (for CI/monitoring)
# Will exit with code 1 if any critical service is unhealthy
./deployment/scripts/install-services.sh --remote --verify
```

## Options

| Option | Description |
|--------|-------------|
| `--check` | Check status of all services (don't install) |
| `--full` | Include Docker containers in check (use with --check) |
| `--update` | Force update/reinstall all services |
| `--verify` | Verify all services are healthy (fail if critical service down) |
| `--service NAME` | Install only the specified service |
| `--remote` | Execute on remote Pi (uses .env.deploy) |
| `--user USER` | Override the run user for systemd services (default: current user) |
| `--help` | Show help message |

## Prerequisites

Before running the services, ensure:

1. **Environment files exist:**
   - `/srv/cc-financial/shared/.env` - Main application environment
   - `/srv/cc-financial/shared/gitops.env` - GitOps configuration
   - `/srv/cc-financial/shared/health-monitor.env` - Health monitor config (optional)
   - `/srv/cc-financial/shared/cloudflared.env` - Cloudflare tunnel config (optional)

2. **Directories exist:**
   - `/srv/cc-financial/bin/` - Scripts directory
   - `/srv/cc-financial/logs/` - Log files
   - `/srv/cc-financial/current/` - Symlink to current release (created by deploy.sh)

3. **Required scripts in `/srv/cc-financial/bin/`:**
   - `webhook.py` - GitOps webhook server
   - `poll.sh` - GitOps polling script
   - `deploy.sh` - Deployment script
   - `cleanup-images.sh` - Docker image cleanup

4. **Global Dependencies (on Pi):**
   - Health Monitor requires `mqtt`: `sudo npm install -g mqtt`

## Configuration

The script reads SSH credentials from `deployment/.env.deploy`:

```bash
hostIp=192.168.68.117
username=mill
password=xxxx
SSH_DOMAIN=ssh.millenniumist.dpdns.org
```

## Error Handling

- **Critical services (marked YES):** If a critical service fails, the script will exit immediately with a non-zero exit code.
- **Non-critical services:** Failures are logged as warnings but don't stop the script.
- **Dependencies:** The script checks if service dependencies are active before installing.

## Fail-Fast Behavior

When using `--verify`, the script will:
1. Check all services are active
2. Exit with code 1 if ANY critical service is unhealthy
3. Log warnings for non-critical unhealthy services

This makes it suitable for use in CI/CD pipelines or monitoring scripts.

## Comparison to Old Scripts

The new `install-services.sh` replaces the old `install-cleanup.sh` with the following improvements:

| Feature | Old Script | New Script |
|---------|------------|------------|
| Services covered | Only cleanup | ALL 6 services |
| Error handling | Hides failures with `\|\| true` | Fail-fast for critical services |
| Code duplication | sshpass/non-sshpass duplicated | Single code path |
| Hardcoded user | Yes (`mill`) | No (uses `__RUN_USER__` placeholder) |
| Check functionality | None | Full status check with `--check` |
| Docker container check | None | Yes (with `--full`) |
| Verification mode | None | Yes (`--verify` for CI/monitoring) |

## Examples

```bash
# Complete setup on a new Pi
./deployment/scripts/install-services.sh --remote --user mill

# Daily health check (add to cron)
./deployment/scripts/install-services.sh --remote --verify

# Debug: see what's running
./deployment/scripts/install-services.sh --remote --check --full

# After making changes to service files, update on Pi
./deployment/scripts/install-services.sh --remote --update
```
