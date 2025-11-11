# Deployment Infrastructure

This directory contains all the infrastructure and scripts needed to self-host the CC Financial application.

## 📁 Directory Structure

```
deployment/
├── deploy-local.sh              # Deploy to local machine
├── deploy-remote.sh             # Deploy to remote host
├── docker-compose.selfhost.yml  # Docker Compose configuration
├── config.example.sh            # Configuration template
├── .env.example                 # Remote host connection template
├── cloudflare/                  # Cloudflare Tunnel configuration
│   ├── config.example.yml
│   └── README.md
├── scripts/                     # Deployment helper scripts
├── DEPLOY-README.md             # Detailed deployment guide
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

### Remote Connection (`.env` for deploy-remote.sh)

```bash
hostIp="192.168.1.100"           # Local IP of remote host
username="pi"                     # SSH username
password="your-password"          # SSH password (optional if using keys)
```

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

### Remote Deployment Flow

```
1. Prepare .env.production locally
2. Auto-detect connection (local network vs tunnel)
3. rsync app directory to remote host
4. Transfer docker-compose and cloudflare configs
5. Build Docker image on remote host
6. Start container and tunnel on remote host
```

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
