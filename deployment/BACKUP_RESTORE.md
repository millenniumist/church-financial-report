# Backup and Restore Documentation

Complete guide for backing up and restoring the CC Financial Application running on Raspberry Pi.

## Overview

The backup system protects three critical components:
1. **PostgreSQL Database** - All application data (bulletins, missions, projects, etc.)
2. **Docker Volume** - Bulletin PDFs and uploaded files
3. **Configuration Files** - Environment variables and service configs

## Quick Start

### Automated Backups (Recommended)

Run the deployment script which automatically sets up backup scripts and cron job:

```bash
./deployment/deploy-remote.sh
```

**That's it!** The deployment script automatically:
- Transfers backup scripts to your Pi
- Sets up a cron job for daily backups at 2:00 AM
- Configures 6-month retention policy (180 days)

### Manual Backup

To run a backup immediately:

```bash
# On the Pi
cd /home/mill/hosting/scripts
./backup.sh
```

### List Available Backups

```bash
./restore.sh list
```

### Restore from Backup

```bash
./restore.sh <backup_timestamp>

# Example:
./restore.sh 20250114_020000
```

## Detailed Documentation

### Backup Script (`backup.sh`)

**Location on Pi:** `/home/mill/hosting/scripts/backup.sh`

**What it backs up:**
- PostgreSQL database (`cc_financial`) using `pg_dump`
- Docker volume (`hosting_bulletins-data`) containing bulletin PDFs
- Configuration files:
  - `.env.production`
  - `deployment/.env`
  - `cloudflare/` directory
  - `docker-compose.selfhost.yml`

**Backup location:** `/home/mill/hosting/backups/<timestamp>/`

**Usage:**
```bash
./backup.sh                    # Local backup only
./backup.sh --remote           # Backup + transfer to remote host
```

**Environment Variables:**
```bash
BACKUP_DIR=/path/to/backups    # Override backup directory (default: /home/mill/hosting/backups)
RETENTION_DAYS=180             # Days to keep old backups (default: 180 / 6 months)
REMOTE_BACKUP=true             # Enable remote backup
REMOTE_BACKUP_HOST=user@host   # Remote host for backup transfer
REMOTE_BACKUP_PATH=/path       # Remote backup path
```

**Backup Structure:**
```
/home/mill/hosting/backups/
├── 20250114_020000/
│   ├── backup.log                          # Backup log
│   ├── backup-metadata.json                # Backup metadata
│   ├── database_cc_financial.sql           # Database dump
│   ├── volume_bulletins-data.tar.gz        # Volume backup
│   └── config/
│       ├── .env.production
│       ├── deployment.env
│       ├── cloudflare/
│       └── docker-compose.selfhost.yml
├── 20250113_020000/
└── ...
```

**Retention Policy:**
- Keeps backups for 180 days (6 months) by default
- Older backups are automatically deleted
- Customize with `RETENTION_DAYS` environment variable

### Restore Script (`restore.sh`)

**Location on Pi:** `/home/mill/hosting/scripts/restore.sh`

**Usage:**
```bash
./restore.sh list                          # List available backups
./restore.sh <timestamp>                   # Full restore
./restore.sh <timestamp> --skip-db         # Restore only volume and config
./restore.sh <timestamp> --skip-volume     # Restore only database and config
./restore.sh <timestamp> --skip-config     # Restore only database and volume
```

**What it does:**
1. **Database Restore:**
   - Stops the application container
   - Drops existing database
   - Recreates database from backup using `pg_restore`

2. **Volume Restore:**
   - Clears existing volume data
   - Extracts backup archive into volume

3. **Configuration Restore:**
   - Restores environment files
   - Restores Cloudflare tunnel config
   - Restores docker-compose file

4. **Application Restart:**
   - Restarts the application container
   - Verifies container is running

**Safety Features:**
- Confirmation prompt before restore
- Shows what will be restored
- Stops application during restore to prevent data corruption

### Automated Backups with Cron (`setup-cron.sh`)

**Location on Pi:** `/home/mill/hosting/scripts/setup-cron.sh`

**Usage:**
```bash
./setup-cron.sh                           # Install cron job (2 AM daily)
./setup-cron.sh --uninstall               # Remove cron job
CRON_TIME="0 3 * * *" ./setup-cron.sh    # Install at 3 AM daily
```

**Default Schedule:**
- Runs daily at 2:00 AM
- Logs to `/home/mill/hosting/backups/cron.log`

**Custom Schedules:**
```bash
# Every 6 hours
CRON_TIME="0 */6 * * *" ./setup-cron.sh

# Weekly on Sunday at midnight
CRON_TIME="0 0 * * 0" ./setup-cron.sh

# Daily at 3 AM
CRON_TIME="0 3 * * *" ./setup-cron.sh
```

**Verify Cron Job:**
```bash
crontab -l
```

**Check Cron Logs:**
```bash
tail -f /home/mill/hosting/backups/cron.log
```

## Common Tasks

### Initial Setup on Pi

Automated backups are **automatically configured** when you run the deployment script:

```bash
# On your Mac
cd /Users/suparit/Desktop/code/cc-financial
./deployment/deploy-remote.sh
```

To verify the backup setup:

```bash
# SSH into Pi
ssh mill@192.168.68.117

# Verify cron job is installed
crontab -l

# Verify scripts are present
ls -la /home/mill/hosting/scripts/

# (Optional) Test backup manually
cd /home/mill/hosting/scripts
./backup.sh

# Verify backup was created
ls -la /home/mill/hosting/backups/
```

### Disaster Recovery

If your Pi fails completely:

1. **Get a new Pi and set up the base system**

2. **Deploy the application:**
   ```bash
   # On your Mac
   cd /Users/suparit/Desktop/code/cc-financial
   ./deployment/deploy-remote.sh
   ```

3. **Transfer backup from remote location:**
   ```bash
   # If you had REMOTE_BACKUP enabled
   ssh mill@192.168.68.117
   rsync -avz backup-host:/path/to/backups/ /home/mill/hosting/backups/
   ```

4. **Restore from backup:**
   ```bash
   cd /home/mill/hosting/scripts
   ./restore.sh list
   ./restore.sh <timestamp>
   ```

### Database-Only Restore

If only the database is corrupted but files are intact:

```bash
./restore.sh <timestamp> --skip-volume --skip-config
```

### Volume-Only Restore

If bulletin PDFs are lost but database is intact:

```bash
./restore.sh <timestamp> --skip-db --skip-config
```

### Verify Backup Integrity

Check a backup's contents:

```bash
cd /home/mill/hosting/backups/20250114_020000

# Check backup metadata
cat backup-metadata.json

# View backup log
cat backup.log

# List volume contents
tar -tzf volume_bulletins-data.tar.gz | head -20

# Check database backup (requires PostgreSQL)
pg_restore --list database_cc_financial.sql
```

## Monitoring and Maintenance

### Check Backup Status

```bash
# List recent backups
ls -lht /home/mill/hosting/backups/ | head -10

# Check latest backup size
du -sh /home/mill/hosting/backups/$(ls -t /home/mill/hosting/backups/ | head -1)

# View latest backup metadata
cat /home/mill/hosting/backups/$(ls -t /home/mill/hosting/backups/ | head -1)/backup-metadata.json
```

### Monitor Disk Space

```bash
# Check available disk space
df -h /home/mill/hosting/backups

# Check backup directory size
du -sh /home/mill/hosting/backups
```

### Adjust Retention Policy

The default retention is 180 days (6 months). If you need to adjust this:

```bash
# To reduce retention (e.g., 90 days / 3 months)
export RETENTION_DAYS=90

# Or modify the cron job
crontab -e
# Change the line to: 0 2 * * * RETENTION_DAYS=90 /home/mill/hosting/scripts/backup.sh >> /home/mill/hosting/backups/cron.log 2>&1

# To increase retention (e.g., 365 days / 1 year)
export RETENTION_DAYS=365
```

## Troubleshooting

### Backup Fails with "Database connection failed"

Check database is running:
```bash
sudo systemctl status postgresql
PGPASSWORD=cc2025secure psql -h localhost -U ccfinapp -d cc_financial -c "SELECT 1"
```

### Volume Backup Fails

Check Docker is running and volume exists:
```bash
docker ps
docker volume ls | grep bulletins-data
```

### Restore Fails with "Container won't start"

Check logs:
```bash
docker logs nextjs-app
```

Check database connection:
```bash
PGPASSWORD=cc2025secure psql -h localhost -U ccfinapp -d cc_financial -c "SELECT version()"
```

### Cron Job Not Running

Check cron service:
```bash
sudo systemctl status cron

# View cron logs
sudo journalctl -u cron -n 50
```

Verify cron job syntax:
```bash
crontab -l
```

## Remote Backup Setup (Optional)

To automatically transfer backups to a remote server:

1. **Set up SSH key authentication:**
   ```bash
   ssh-keygen -t ed25519
   ssh-copy-id user@backup-server
   ```

2. **Configure environment variables:**
   ```bash
   # Edit deployment/.env on your Mac
   REMOTE_BACKUP_HOST=user@backup-server
   REMOTE_BACKUP_PATH=/path/to/remote/backups
   ```

3. **Run backup with remote transfer:**
   ```bash
   ./backup.sh --remote
   ```

4. **Update cron job:**
   ```bash
   crontab -e
   # Change: 0 2 * * * /home/mill/hosting/scripts/backup.sh --remote
   ```

## Security Considerations

### Sensitive Information in Backups

Backups contain:
- Database credentials
- API keys (Google Sheets, Cloudinary)
- Cloudflare tunnel credentials

**Recommendations:**
1. Restrict backup directory permissions:
   ```bash
   chmod 700 /home/mill/hosting/backups
   ```

2. Encrypt remote backups:
   ```bash
   # In backup.sh, before rsync:
   tar czf - "$BACKUP_DIR" | gpg --encrypt --recipient your-key > backup.tar.gz.gpg
   ```

3. Use separate backup user with limited permissions

## Integration with Deployment

The deployment script (`deploy-remote.sh`) automatically:
1. Creates `/home/mill/hosting/scripts/` directory
2. Transfers all backup scripts to the Pi
3. Makes scripts executable
4. Sets up cron job for automated daily backups at 2:00 AM
5. Configures 6-month (180 days) retention policy

**No manual setup required** - backups are automatically configured on every deployment!

## Support

For issues or questions:
1. Check logs: `/home/mill/hosting/backups/cron.log`
2. Review backup metadata: `backup-metadata.json`
3. Test scripts manually with verbose output
4. Check system resources (disk space, memory)
