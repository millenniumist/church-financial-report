# Docker Deployment Guide

Self-hosted deployment with automated cron jobs for data synchronization.

## 📋 Overview

This setup includes:
- **Next.js Application** - Main web application
- **Cron Worker** - Automated data sync from Google Sheets to database
- **Prisma + PostgreSQL** - Database with Prisma Accelerate

## 🚀 Quick Start

### 1. Configure Environment

Create `.env.local` with required variables:

```env
# Database
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
```

### 2. Deploy to Hosting Directory

```bash
# Run deployment script
./deploy.sh

# Or manually copy to hosting directory
rsync -av --exclude='node_modules' --exclude='.next' . /Users/suparit/Desktop/code/hosting/app/
```

### 3. Build and Run

```bash
cd /Users/suparit/Desktop/code/hosting

# Build and start services
docker-compose -f docker-compose.selfhost.yml up -d --build

# View logs
docker-compose -f docker-compose.selfhost.yml logs -f
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:3000/api/health

# Manual sync test
curl http://localhost:3000/api/cron/sync-financial

# View financial data
curl http://localhost:3000/api/financial
```

## ⏰ Cron Job Configuration

### Default Schedule

The cron worker syncs data **every 6 hours** by default.

### Modify Schedule

Edit `docker/cron/crontab`:

```bash
# Every 6 hours (default)
0 */6 * * * /usr/local/bin/sync-financial.sh >> /var/log/cron.log 2>&1

# Every hour
0 * * * * /usr/local/bin/sync-financial.sh >> /var/log/cron.log 2>&1

# Daily at 2 AM
0 2 * * * /usr/local/bin/sync-financial.sh >> /var/log/cron.log 2>&1

# Every 30 minutes
*/30 * * * * /usr/local/bin/sync-financial.sh >> /var/log/cron.log 2>&1
```

After modifying, rebuild and restart:

```bash
docker-compose -f docker-compose.selfhost.yml up -d --build cron-worker
```

## 🔧 Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.selfhost.yml logs -f

# Just app
docker-compose -f docker-compose.selfhost.yml logs -f nextjs-app

# Just cron
docker-compose -f docker-compose.selfhost.yml logs -f cron-worker
```

### Manual Sync

```bash
# From host
curl http://localhost:3000/api/cron/sync-financial

# From inside cron container
docker exec cc-financial-cron /usr/local/bin/sync-financial.sh
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.selfhost.yml restart

# Restart specific service
docker-compose -f docker-compose.selfhost.yml restart nextjs-app
docker-compose -f docker-compose.selfhost.yml restart cron-worker
```

### Update Application

```bash
# 1. Update code in cc-financial directory
cd /Users/suparit/Desktop/code/cc-financial
git pull  # or make changes

# 2. Deploy updates
./deploy.sh

# 3. Rebuild and restart
cd /Users/suparit/Desktop/code/hosting
docker-compose -f docker-compose.selfhost.yml up -d --build
```

## 🐛 Troubleshooting

### Cron Jobs Not Running

```bash
# Check if cron worker is running
docker ps | grep cron-worker

# View cron logs
docker logs cc-financial-cron

# Check crontab
docker exec cc-financial-cron cat /etc/crontabs/root

# Manually trigger sync
docker exec cc-financial-cron /usr/local/bin/sync-financial.sh
```

### Database Connection Errors

```bash
# Verify DATABASE_URL is set
docker exec cc-financial-app env | grep DATABASE_URL

# Test Prisma connection
docker exec cc-financial-app npx prisma db pull

# Check health endpoint
curl http://localhost:3000/api/health
```

### Google Sheets API Errors

```bash
# Check credentials file
docker exec cc-financial-app ls -la /app/privatekey-gsheet.json

# Check spreadsheet ID
docker exec cc-financial-app env | grep GOOGLE_SHEETS_SPREADSHEET_ID

# Test sync manually
curl http://localhost:3000/api/cron/sync-financial
```

### Container Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose.selfhost.yml logs

# Check disk space
df -h

# Remove old containers and rebuild
docker-compose -f docker-compose.selfhost.yml down
docker-compose -f docker-compose.selfhost.yml up -d --build
```

## 📦 File Structure

```
cc-financial/
├── docker/
│   └── cron/
│       ├── Dockerfile          # Cron worker image
│       ├── crontab            # Cron schedule
│       └── sync-financial.sh  # Sync script
├── Dockerfile                  # Main app image
├── docker-compose.yml         # Container orchestration
├── deploy.sh                  # Deployment script
└── DOCKER.md                  # This file

hosting/
├── app/                       # Deployed app files (from cc-financial)
├── cron/                      # Deployed cron files
└── docker-compose.selfhost.yml # Production compose file
```

## 🔐 Security Notes

1. **Never commit** `.env.local` or credentials files
2. Add authentication to cron endpoint in production:
   ```env
   CRON_SECRET=your-secret-token
   ```
3. Use Cloudflare Tunnel for external access
4. Keep Docker images updated:
   ```bash
   docker-compose -f docker-compose.selfhost.yml pull
   ```

## 📊 Monitoring

### Check Sync Status

```bash
# View last sync result
docker logs cc-financial-cron --tail 20

# Check database records
curl http://localhost:3000/api/financial | jq '.monthlyData | length'
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health | jq

# Docker health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🌐 Cloudflare Tunnel Integration

Your app runs on `localhost:3000` and is exposed via Cloudflare Tunnel.

The cron worker uses the internal Docker network (`http://nextjs-app:3000`) for better performance and security.

## 💡 Tips

- **Logs retention**: Cron logs are stored in `/var/log/cron.log` inside the container
- **Timezone**: Set `TZ` environment variable in docker-compose.yml
- **Performance**: Prisma Accelerate caches queries for 60 seconds
- **Backup**: Regular database backups recommended (Prisma Accelerate handles this)

## 📝 Need Help?

1. Check logs: `docker-compose logs -f`
2. Verify environment variables are set
3. Test endpoints manually with curl
4. Check GitHub issues or documentation
