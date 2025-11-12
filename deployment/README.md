# Deployment Infrastructure

This directory contains all the infrastructure and scripts needed to self-host the CC Financial application.

## 📁 Directory Structure

```
deployment/
├── deploy-local.sh              # Deploy to local machine
├── deploy-remote.sh             # Deploy to remote host (includes health monitoring)
├── docker-compose.selfhost.yml  # Docker Compose configuration
├── config.example.sh            # Optional configuration overrides
├── .env.example                 # Configuration template (SSH, MQTT, health monitor)
├── .env                         # Your configuration (create from .env.example)
├── health-monitor.js            # Health monitoring service with MQTT
├── health-monitor.service       # Systemd service file
├── cloudflare/                  # Cloudflare Tunnel configuration
│   ├── config.example.yml
│   └── README.md
├── DEPLOY-README.md             # Detailed deployment guide
├── HEALTH_MONITOR_README.md     # Health monitoring documentation
├── MQTT_ANDROID_SETUP.md        # Android MQTT dashboard setup
└── README.md                    # This file
```

## 🚀 Quick Deployment

### Option 1: Local Machine

Deploy on your local development machine (Mac, Linux, or WSL):

```bash
# 1. Configure deployment
cp config.example.sh config.sh
nano config.sh  # Edit configuration

# 2. Set up Cloudflare Tunnel (one-time setup)
cd cloudflare
cp config.example.yml config.yml
# Follow instructions in cloudflare/README.md

# 3. Deploy
cd ..
./deploy-local.sh
```

**What it does:**
- Prepares production environment from your local `.env`
- Builds Docker image from the monorepo app
- Starts Next.js container on port 8358
- Launches Cloudflare Tunnel for public access

**Access:**
- Local: http://localhost:8358
- Public: https://your-domain.com

### Option 2: Remote Host

Deploy to a remote server (e.g., Raspberry Pi, VPS):

```bash
# 1. Configure remote connection
cp .env.example .env
nano .env  # Add: hostIp, username, password

# 2. Configure deployment
cp config.example.sh config.sh
nano config.sh

# 3. Deploy
./deploy-remote.sh
```

**What it does:**
- Syncs app files from monorepo to remote host
- Auto-detects local network vs. Cloudflare Tunnel connection
- Builds and deploys on remote host
- Restarts Cloudflare Tunnel on remote host

## ⚙️ Configuration

### Global Config (`config.sh`)

```bash
# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_NAME="your-tunnel-name"
DOMAIN="your-domain.com"

# Docker
CONTAINER_NAME="nextjs-app"
APP_PORT="8358"

# Environment
NODE_ENV="production"
```

**Note:** In the monorepo, you no longer need `DEV_DIR` - the scripts automatically use `../app`.

### Remote Connection & Health Monitoring (`.env` for deploy-remote.sh)

Create `.env` from `.env.example`:

```bash
# Remote Host
hostIp="192.168.1.100"
username="pi"
password="your-password"

# Health Monitoring (optional)
ENABLE_HEALTH_MONITOR=true
MQTT_USERNAME=ccchurch
MQTT_PASSWORD=your-mqtt-password
MQTT_MOBILE_USERNAME=mobile
MQTT_MOBILE_PASSWORD=your-mobile-password
CHECK_INTERVAL=60000              # Check every 60 seconds

# Tailscale (optional - for remote MQTT access)
ENABLE_TAILSCALE=true
TAILSCALE_AUTH_KEY=""             # Optional: Pre-auth key for unattended setup
```

**Health Monitoring Features:**
- Automatic MQTT broker (Mosquitto) installation
- Continuous app health monitoring
- Publish metrics every 60 seconds
- Android MQTT Dashboard support
- Home Assistant auto-discovery

**Tailscale Integration (Remote Access):**
- Secure remote MQTT access without port forwarding
- Automatic Tailscale installation during deployment
- Optional pre-auth key for unattended setup
- Access MQTT from anywhere via Tailscale IP

## 🔧 How It Works

### Monorepo Integration

The deployment scripts are designed to work seamlessly with the monorepo structure:

1. **App Source**: Located at `../app` (parent directory)
2. **No Syncing Needed**: Scripts build directly from monorepo
3. **Environment**: Copies `.env` → `.env.production` for Docker

### Local Deployment Flow

```
1. Prepare .env.production from app/.env
2. Verify Dockerfile and dependencies exist
3. Build Docker image from ../app
4. Start container with docker-compose
5. Health check on localhost:8358
6. Start/restart Cloudflare Tunnel
```

### Remote Deployment Flow (Mac M2 → Raspberry Pi)

```
1. Prepare .env.production locally
2. Build Docker image locally on Mac M2 (ARM64)
3. Save and compress image as tar file
4. Auto-detect connection (local network vs tunnel)
5. Transfer pre-built image to Pi
6. Transfer cloudflare configs
7. Load Docker image on Pi (no build needed!)
8. Start container and tunnel on Pi
9. Setup health monitoring with MQTT (if enabled)
   - Install Mosquitto broker
   - Install Node.js and mqtt package
   - Deploy health monitor service
   - Start systemd service
10. Setup Tailscale for remote access (if enabled)
   - Install Tailscale on Pi
   - Authenticate (auto with pre-auth key or manual)
   - Get Tailscale IP
11. Verify all services running
```

**Benefits:**
- Much faster deployments (build on powerful Mac M2)
- Less strain on Raspberry Pi resources
- Architecture match (ARM64)

## 🐳 Docker Details

### Docker Compose

The `docker-compose.selfhost.yml` file defines:
- **Build Context**: `../app` (monorepo app directory)
- **Container**: nextjs-app
- **Port**: 8358
- **Environment**: Loads from `.env.production`
- **Network**: Isolated bridge network

### Multi-stage Build

The Dockerfile uses a 3-stage build:
1. **deps**: Install dependencies
2. **builder**: Generate Prisma client, build Next.js
3. **runner**: Minimal production image with only runtime files

## 🌐 Cloudflare Tunnel

### Setup (One-time)

```bash
# 1. Install cloudflared
brew install cloudflared

# 2. Login to Cloudflare
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create your-tunnel-name

# 4. Configure tunnel
cd cloudflare
cp config.example.yml config.yml
# Edit config.yml with your tunnel ID and credentials

# 5. Set up DNS
# Point your-domain.com to the tunnel via Cloudflare dashboard
```

### Configuration

The tunnel configuration (`cloudflare/config.yml`) routes:
- `your-domain.com` → `localhost:8358` (Next.js app)
- `ssh.your-domain.com` → `localhost:22` (SSH access)

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs nextjs-app

# Check environment
docker exec nextjs-app env | grep DATABASE_URL

# Restart container
docker restart nextjs-app
```

### Cloudflare Tunnel issues

```bash
# Check tunnel logs
tail -f cloudflared.log

# Test tunnel
cloudflared tunnel info your-tunnel-name

# Restart tunnel
pkill cloudflared
./deploy-local.sh  # Will restart tunnel
```

### Database connection issues

```bash
# Verify DATABASE_URL in .env.production
cat ../app/.env.production | grep DATABASE_URL

# Test from container
docker exec -it nextjs-app sh
# Inside container:
npx prisma db pull  # Test connection
```

### Remote deployment fails

```bash
# Test SSH connection
ssh username@hostIp

# Test with Cloudflare Tunnel
ssh -o ProxyCommand="cloudflared access ssh --hostname ssh.your-domain.com" username@ssh.your-domain.com

# Check remote Docker
ssh username@hostIp docker ps
```

## 📝 Scripts Reference

### deploy-local.sh

**Usage:** `./deploy-local.sh`

**Steps:**
1. Prepare production environment
2. Verify deployment files
3. Load environment variables
4. Build and restart Docker container
5. Health check
6. Restart Cloudflare Tunnel

**Requirements:**
- Docker
- cloudflared
- Python 3 (for env file normalization)

### deploy-remote.sh

**Usage:** `./deploy-remote.sh`

**Steps:**
1. Test SSH connectivity
2. Prepare production environment
3. Verify local deployment files
4. Create remote directories
5. Transfer files to remote host
6. Build and restart on remote
7. Health check
8. Restart tunnel on remote

**Requirements:**
- ssh / sshpass (for local network)
- cloudflared (for tunnel connection)
- rsync

## 🔒 Security

### Files to NEVER Commit

- `config.sh` - Contains local paths
- `.env` - Contains SSH credentials
- `cloudflare/*.json` - Tunnel credentials
- `cloudflare/config.yml` - Configured tunnel settings

All these are in `.gitignore` - keep them secret!

### Environment Variables

Sensitive data in `.env.production`:
- `DATABASE_URL` - Database credentials
- `GOOGLE_SERVICE_ACCOUNT_PATH` - Service account key path

## 📚 Additional Documentation

- [DEPLOY-README.md](DEPLOY-README.md) - Original detailed deployment guide
- [Cloudflare Setup](cloudflare/README.md) - Tunnel configuration details
- [Main README](../README.md) - Monorepo overview

## 🆘 Getting Help

Common issues and solutions:

1. **"App directory not found"**: Run from deployment directory
2. **"GOOGLE_SHEETS_SPREADSHEET_ID must be set"**: Add to `.env`
3. **"Failed to start cloudflared"**: Check tunnel configuration
4. **"Cannot connect to remote host"**: Verify SSH credentials in `.env`

For more help, see the full deployment guide: [DEPLOY-README.md](DEPLOY-README.md)
