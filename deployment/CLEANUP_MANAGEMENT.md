# Storage Cleanup & Management

Complete guide for managing logs and media storage to prevent bloating and optimize costs.

## Overview

This deployment includes automated cleanup solutions for:

1. **Elasticsearch Logs** - Automated lifecycle management with 90-day retention
2. **Cloudinary Media** - Orphaned file detection and removal

## Elasticsearch Log Management

### What It Does

**Index Lifecycle Management (ILM)** automatically manages your logs through three phases:

1. **Hot Phase (0-30 days)**
   - Actively searchable logs
   - High performance, no optimization

2. **Warm Phase (30-90 days)**
   - Read-only, compressed
   - Reduced storage footprint
   - Still searchable

3. **Delete Phase (90+ days)**
   - Automatically deleted
   - Prevents disk space issues

### Setup (One-Time)

Run the setup script on your Pi:

```bash
ssh mill@192.168.68.117
cd /home/mill/hosting/scripts

# Run ILM setup
./setup-elasticsearch-ilm.sh
```

**Configuration Options:**

```bash
# Custom retention (default: 90 days)
LOG_RETENTION_DAYS=180 ./setup-elasticsearch-ilm.sh

# Custom warm phase (default: 30 days)
WARM_PHASE_DAYS=14 ./setup-elasticsearch-ilm.sh
```

### Verification

Check ILM status:

```bash
# View ILM policy
curl http://localhost:9200/_ilm/policy/cc-church-logs-policy?pretty

# Check index lifecycle status
curl 'http://localhost:9200/_cat/indices/cc-church-logs-*?v&h=index,docs.count,store.size,creation.date.string'

# Explain ILM for specific index
curl http://localhost:9200/cc-church-logs-*/_ilm/explain?pretty
```

### Manual Operations

**Force phase transition:**
```bash
# Move index to next phase immediately (for testing)
curl -X POST "http://localhost:9200/_ilm/move/cc-church-logs-2025.01.14" \
  -H 'Content-Type: application/json' \
  -d '{
  "current_step": {
    "phase": "hot"
  },
  "next_step": {
    "phase": "warm"
  }
}'
```

**Delete old indices manually:**
```bash
# Delete specific index
curl -X DELETE "http://localhost:9200/cc-church-logs-2024.12.01"

# Delete indices older than date (BE CAREFUL!)
curl -X DELETE "http://localhost:9200/cc-church-logs-2024.11*"
```

### Monitoring

**View index sizes:**
```bash
curl -s 'http://localhost:9200/_cat/indices/cc-church-logs-*?v&h=index,store.size,docs.count' | sort -k1
```

**Check disk usage in Kibana:**
1. Open http://192.168.68.117:5601
2. Stack Management → Index Management
3. View index sizes and lifecycle phases

### Expected Disk Usage

With **90-day retention** and typical usage:

- **Daily logs:** ~10-50 MB/day
- **Monthly:** ~300 MB - 1.5 GB
- **Total (90 days):** ~900 MB - 4.5 GB

After warm phase compression: **~40% smaller**

---

## Cloudinary Media Cleanup

### What It Does

Identifies and removes:

1. **Orphaned Files** - Uploaded but not referenced in database (>7 days old)
2. **Old Unreferenced Files** - Files older than retention period (>730 days / 2 years)

**Safety Feature:** Files that are still referenced in the database are **NEVER deleted**, regardless of age.

### How It Works

The script:
1. Scans your database for all Cloudinary URLs
2. Lists all files in your Cloudinary account
3. Identifies files not referenced in DB (orphans)
4. Identifies files older than retention period
5. Reports findings with size estimates
6. Optionally deletes files (dry-run by default)

### Usage

#### On Your Mac (Recommended)

First, create an SSH tunnel to the database:
```bash
cd /Users/suparit/Desktop/code/cc-financial/deployment
sshpass -p "0000" ssh -f -N -L 5432:localhost:5432 mill@192.168.68.117
```

Then run the cleanup:
```bash
cd /Users/suparit/Desktop/code/cc-financial

# Dry run (shows what would be deleted)
DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial" node deployment/scripts/cloudinary-cleanup.js

# Actually delete files
DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial" DRY_RUN=false node deployment/scripts/cloudinary-cleanup.js
```

#### On Raspberry Pi

```bash
ssh mill@192.168.68.117
cd /home/mill/hosting

# Dry run
DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial" node scripts/cloudinary-cleanup.js

# Live mode
DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial" DRY_RUN=false node scripts/cloudinary-cleanup.js
```

**Note:** The deployment script automatically installs required dependencies (`cloudinary` and `@prisma/client`) in `/home/mill/hosting/node_modules` during deployment.

### Automated Monthly Cleanup

The cleanup script runs automatically on the **1st of every month at 3:00 AM** via cron job. You can check the logs:

```bash
ssh mill@192.168.68.117 'tail -f /home/mill/hosting/logs/cloudinary-cleanup.log'
```

To manually trigger the cleanup:
```bash
ssh mill@192.168.68.117 'cd /home/mill/hosting && DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial" DRY_RUN=false node scripts/cloudinary-cleanup.js'
```

### Configuration

Set via environment variables:

```bash
# Retention period (default: 730 days = 2 years)
CLOUDINARY_RETENTION_DAYS=365 node cloudinary-cleanup.js

# Orphan age threshold (default: 7 days)
ORPHAN_AGE_DAYS=14 node cloudinary-cleanup.js

# Custom folder (default: church-cms)
CLOUDINARY_FOLDER=custom-folder node cloudinary-cleanup.js
```

### Example Output

```
🧹 Cloudinary Cleanup Script
============================

Configuration:
  Mode: 🔍 DRY RUN (no files will be deleted)
  Folder: church-cms
  Retention: 730 days
  Orphan Age Threshold: 7 days

📊 Scanning database for referenced Cloudinary URLs...
✓ Found 45 referenced files in database

☁️  Fetching all resources from Cloudinary...
✓ Found 68 files in Cloudinary

📊 Analysis Results:
====================

Total files in Cloudinary: 68
Referenced in database: 45
Orphaned files (>7 days old): 18
Old unreferenced files (>730 days): 5

Space to recover from orphaned files: 12.45 MB
Space to recover from old files: 3.21 MB

🗑️  Orphaned Files (not referenced in database):
================================================

  • church-cms/temp-upload-abc123.jpg
    Age: 15 days | Size: 2.31 MB | Created: 2025-10-30
  • church-cms/old-bulletin-xyz789.pdf
    Age: 45 days | Size: 5.12 MB | Created: 2024-12-01
  ... and 16 more

🔍 DRY RUN MODE - No files will be deleted

To actually delete these files, run with:
  DRY_RUN=false node cloudinary-cleanup.js
```

### Automated Cleanup

Add to crontab for monthly automated cleanup:

```bash
ssh mill@192.168.68.117
crontab -e
```

Add this line:

```bash
# Cloudinary cleanup - 1st of every month at 3 AM
0 3 1 * * cd /home/mill/hosting/scripts && DRY_RUN=false node cloudinary-cleanup.js >> /home/mill/hosting/cloudinary-cleanup.log 2>&1
```

### Safety Features

1. **Dry-Run Default** - Must explicitly set `DRY_RUN=false`
2. **Orphan Grace Period** - Only deletes orphans >7 days old (configurable)
3. **Detailed Logs** - Shows exactly what will be deleted
4. **Referenced File Warnings** - Warns if deleting DB-referenced files

### Cost Savings

Cloudinary free tier: **25 GB storage**

Typical bloating sources:
- Test uploads during development
- Deleted bulletins (URL removed from DB, file remains)
- Failed uploads (partial files)
- Old replaced images

**Expected savings:** 20-50% reduction in storage with regular cleanup

---

## Deployment Integration

### Automatic Setup

The deployment script (`deploy-remote.sh`) automatically:

1. ✅ Transfers cleanup scripts to Pi
2. ✅ Sets up backup cron jobs
3. ⚠️  **Does NOT** auto-setup log cleanup (requires manual run)
4. ⚠️  **Does NOT** auto-setup Cloudinary cleanup (requires manual run)

### Initial Setup Checklist

After deployment, run these once:

```bash
# 1. Setup Elasticsearch ILM
ssh mill@192.168.68.117 "/home/mill/hosting/scripts/setup-elasticsearch-ilm.sh"

# 2. Test Cloudinary cleanup (dry-run)
ssh mill@192.168.68.117 "cd /home/mill/hosting/scripts && node cloudinary-cleanup.js"

# 3. If satisfied, run actual cleanup
ssh mill@192.168.68.117 "cd /home/mill/hosting/scripts && DRY_RUN=false node cloudinary-cleanup.js"

# 4. (Optional) Setup monthly Cloudinary cron
ssh mill@192.168.68.117
crontab -e
# Add: 0 3 1 * * cd /home/mill/hosting/scripts && DRY_RUN=false node cloudinary-cleanup.js >> /home/mill/hosting/cloudinary-cleanup.log 2>&1
```

---

## Monitoring & Alerts

### Elasticsearch Disk Usage

Check disk space on Pi:

```bash
ssh mill@192.168.68.117 "df -h | grep -E '(Filesystem|/dev/root)'"
```

**Alert thresholds:**
- ⚠️ Warning: >70% disk usage
- 🚨 Critical: >85% disk usage

### Cloudinary Storage

Check usage in Cloudinary dashboard:
1. Login: https://cloudinary.com/console
2. View: Storage & Bandwidth usage
3. Monitor: Approaching 25 GB free tier limit

### Automated Monitoring

Add to `health-monitor.js` (future enhancement):

```javascript
// Check disk space
const diskUsage = await checkDiskSpace();
if (diskUsage > 80) {
  sendDiscordAlert('⚠️ Pi disk usage high: ' + diskUsage + '%');
}

// Check Cloudinary usage (via API)
const cloudinaryUsage = await checkCloudinaryUsage();
if (cloudinaryUsage > 20000) { // 20 GB
  sendDiscordAlert('⚠️ Cloudinary near limit: ' + cloudinaryUsage + ' MB');
}
```

---

## Troubleshooting

### Elasticsearch Issues

**Problem: ILM not transitioning indices**

```bash
# Check ILM is running
curl http://localhost:9200/_ilm/status

# If stopped, start it
curl -X POST "http://localhost:9200/_ilm/start"

# Check policy explain
curl http://localhost:9200/cc-church-logs-*/_ilm/explain?pretty
```

**Problem: Disk still full after cleanup**

```bash
# Check all indices (not just logs)
curl 'http://localhost:9200/_cat/indices?v&h=index,store.size&s=store.size:desc'

# Delete large non-log indices if safe
curl -X DELETE "http://localhost:9200/large-index-name"
```

### Cloudinary Issues

**Problem: Script fails with authentication error**

Check environment variables:
```bash
ssh mill@192.168.68.117 "cat /home/mill/hosting/.env.production | grep CLOUDINARY"
```

**Problem: "Orphaned" files are actually used**

- Check if URLs use different domains (res.cloudinary.com vs cloudinary.com)
- Check if files referenced in deleted database records
- Increase `ORPHAN_AGE_DAYS` to be more conservative

**Problem: Script crashes with "Out of memory"**

Cloudinary has >1000 files - add pagination:
```javascript
// Already implemented in script, but if issues persist:
// Process files in batches of 100 instead of all at once
```

---

## Best Practices

### Log Management

1. **Review retention monthly** - Adjust if needed
2. **Monitor disk usage weekly** - Use `df -h`
3. **Test ILM setup** - Verify phase transitions work
4. **Keep ILM enabled** - Don't disable unless necessary

### Media Management

1. **Run dry-run first** - Always check what will be deleted
2. **Monthly cleanup** - Prevent large accumulations
3. **Backup before cleanup** - Run `backup.sh` before cleanup
4. **Document deletions** - Keep logs of cleanup operations

### Cost Optimization

Current free tier limits:
- **Cloudinary**: 25 GB storage, 25 GB bandwidth/month
- **Elasticsearch**: No limit (self-hosted)

With proper cleanup:
- Logs: ~2-5 GB storage (90 days)
- Media: ~10-20 GB (730 days / 2 years retention, orphans cleaned weekly)
- **Total: Well within free tiers**

---

## Support

For issues:
- Elasticsearch: Check logs with `docker logs elasticsearch`
- Cloudinary: Check script output and Cloudinary console
- General: Check Pi disk space with `df -h`
