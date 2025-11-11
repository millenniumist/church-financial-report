# 🚀 Self-Host Deployment Guide

This repo contains everything needed to deploy the **cc-financial** project on any machine using Docker + Cloudflare Tunnel.

## 1. Prerequisites

### Required Software
- Docker (Colima or Docker Desktop) - ensure `docker compose` works
- `cloudflared` CLI - Cloudflare tunnel client

### Required Repositories
- Clone `cc-financial` development repo on the same machine
- This `hosting` repo (you're here)

### Required Credentials
- Cloudflare tunnel credentials (see `cloudflare/README.md` for setup)
- Google Sheets service account key (`privatekey-gsheet.json` in cc-financial repo)
- Prisma database URL

## 2. Initial Configuration

### Step 1: Global Config File
Copy the configuration template and customize it:

```bash
cd /Users/suparit/Desktop/code/hosting
cp config.example.sh config.sh
```

Edit `config.sh` and set:
- `DEV_DIR` - Path to your cc-financial repository
- `CLOUDFLARE_TUNNEL_NAME` - Your tunnel name
- `DOMAIN` - Your public domain
- `DEV_ENV_FILE` - Which env file to sync from dev repo (default: `.env`)

**This is the only file you need to configure!** All settings are centralized here.

### Step 2: Cloudflare Tunnel
Set up Cloudflare tunnel (one-time):

```bash
# See cloudflare/README.md for detailed instructions
cp cloudflare/config.example.yml cloudflare/config.yml
# Edit cloudflare/config.yml with your tunnel ID and credentials path
```

### Step 3: Development Repo Environment
Make sure your `cc-financial` repo has a `.env` file with:
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `DATABASE_URL`
- `GOOGLE_SERVICE_ACCOUNT_PATH` (path to privatekey-gsheet.json)

## 3. Deploy / update
```bash
cd /Users/suparit/Desktop/code/hosting
./deploy-local.sh
```
The script will:
- Sync code from the development repo into `app/`
- Copy `.env.production` (or `.env.local`) and normalize secrets paths
- Rebuild the Docker image (`hosting-nextjs-app`)
- Restart the container and the `millenniumist` Cloudflare tunnel
- Health check `http://localhost:8358`

## 4. Verify
- Local: http://localhost:8358
- Public: https://millenniumist.dpdns.org
- Logs:
  ```bash
  docker logs nextjs-app
  tail -f cloudflared.log
  ```

## 5. Configuration Reference

### File Structure
```
hosting/
├── config.sh                      (your local config - gitignored)
├── config.example.sh              (template for config.sh)
├── deploy-local.sh                (main deployment script)
├── docker-compose.selfhost.yml    (Docker services definition)
├── DEPLOY-README.md               (this file)
├── cloudflare/
│   ├── config.yml                 (tunnel config - gitignored)
│   ├── config.example.yml         (template)
│   ├── *.json                     (credentials - gitignored)
│   └── README.md                  (setup instructions)
└── app/
    ├── Dockerfile                 (multi-stage build with Prisma)
    └── .env.production            (auto-generated during deploy)
```

### What Gets Gitignored
- `config.sh` - Your local paths and settings
- `cloudflare/config.yml` - Tunnel configuration
- `cloudflare/*.json` - Tunnel credentials
- `app/.env.production` - Environment variables

### Customization
All deployment settings are in `config.sh`:
- Development directory path
- Cloudflare tunnel name
- Domain names
- Container names
- Port mappings
- Which env file to sync from dev repo
