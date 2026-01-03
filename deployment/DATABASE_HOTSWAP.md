# Database Hot-Swap (Automatic Failover)

Automatic database failover system that switches between primary and secondary databases when connection issues are detected.

## Overview

The hot-swap system provides:
- **Automatic Failover**: Switches to secondary database when primary fails
- **Automatic Failback**: Returns to primary when it's healthy again
- **Health Monitoring**: Continuous health checks with configurable intervals
- **Zero Downtime**: Seamless switching with minimal disruption
- **Status Reporting**: Real-time database status via API endpoint

## Architecture

```
┌─────────────────────────────────────────┐
│  Application (Next.js + Prisma)        │
├─────────────────────────────────────────┤
│  Database Connection Manager            │
│  - Health Checks (30s intervals)        │
│  - Failure Detection (3 failures)       │
│  - Automatic Failover/Failback          │
└──────────┬──────────────────┬───────────┘
           │                  │
    ┌──────▼──────┐    ┌─────▼──────────┐
    │   Primary   │    │   Secondary    │
    │  Database   │    │   Database     │
    │ (Local Pi)  │    │ (Cloud/Backup) │
    └─────────────┘    └────────────────┘
```

## Quick Start

### 1. Set Up Secondary Database

You can use any PostgreSQL-compatible database as secondary:

**Cloud Options (Recommended):**
- **Neon** (https://neon.tech) - Serverless PostgreSQL, generous free tier
- **Supabase** (https://supabase.com) - Full Postgres with free tier
- **Railway** (https://railway.app) - Easy deployment platform
- **AWS RDS** - Production-grade managed PostgreSQL

**Local Option:**
- Another Raspberry Pi or server with PostgreSQL

### 2. Configure Environment Variables

Add to your `.env.production` file:

```bash
# Primary database (existing)
DATABASE_URL="postgresql://ccfinapp:cc2025secure@localhost:5432/cc_financial"

# Secondary database for failover
DATABASE_URL_SECONDARY="postgresql://user:password@backup-host:5432/cc_financial"

# Optional: Tune failover behavior
DB_HEALTH_CHECK_INTERVAL=30000      # Health check every 30 seconds
DB_CONNECTION_TIMEOUT=5000          # 5 second connection timeout
DB_FAILURE_THRESHOLD=3              # Fail over after 3 consecutive failures
DB_PRIMARY_RETRY_INTERVAL=120000    # Retry primary every 2 minutes when on secondary
```

### 3. Set Up Cloud Database (Example: Neon)

#### Create Neon Database

1. Go to https://neon.tech and sign up
2. Create a new project
3. Create a database named `cc_financial`
4. Copy the connection string

#### Sync Schema to Secondary

Run Prisma migrations against the secondary database:

```bash
# Set secondary database URL temporarily
export DATABASE_URL="postgresql://user:password@ep-cool-name.neon.tech/cc_financial"

# Push schema to secondary
npx prisma db push

# Test connection
npx prisma db seed
```

### 4. Deploy

Deploy your application - hot-swap will activate automatically when `DATABASE_URL_SECONDARY` is configured.

## How It Works

### Failure Detection

The connection manager continuously monitors database health:

1. **Health Checks**: Every 30 seconds (configurable)
2. **Failure Threshold**: After 3 consecutive failures (configurable)
3. **Automatic Failover**: Switches to secondary database
4. **Logging**: All events logged to application logs

### Failover Process

```
Primary DB → ❌ Connection Failed
          → ❌ Retry 1 Failed
          → ❌ Retry 2 Failed
          → ❌ Threshold Reached (3 failures)
          → 🔄 Switching to Secondary DB
          → ✅ Connected to Secondary
          → [Application continues on secondary]
```

### Failback Process

```
[Running on Secondary DB]
          → ⏰ Every 2 minutes (configurable)
          → 🔍 Check if Primary is healthy
          → ✅ Primary is back online
          → 🔄 Switching back to Primary
          → ✅ Connected to Primary
          → [Application back on primary]
```

## Monitoring

### Health Check API

Check database status at any time:

```bash
curl http://your-domain/api/health
```

**Response without hot-swap:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "database": "connected",
  "hotSwap": {
    "enabled": false,
    "message": "Set DATABASE_URL_SECONDARY to enable automatic database failover"
  }
}
```

**Response with hot-swap (on primary):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "database": "connected",
  "hotSwap": {
    "enabled": true,
    "currentDatabase": "primary",
    "failoverAvailable": true,
    "failureCount": 0
  }
}
```

**Response with hot-swap (after failover):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "database": "connected",
  "hotSwap": {
    "enabled": true,
    "currentDatabase": "secondary",
    "failoverAvailable": true,
    "failureCount": 0,
    "lastFailover": "2025-11-14T10:25:00.000Z",
    "uptimeSinceFailover": "300s"
  }
}
```

### Application Logs

Monitor failover events in your logs:

```bash
# On your Pi
docker logs nextjs-app | grep "DB Manager"

# Or if using Kibana
# View logs at http://192.168.68.117:5601
```

**Log Examples:**
```
[DB Manager] Initializing with configuration:
  Primary: postgresql://ccfinapp:****@localhost:5432/cc_financial
  Secondary: postgresql://user:****@ep-cool-name.neon.tech/cc_financial
  Health check interval: 30000ms
  Failure threshold: 3

[DB Manager] ✅ Connected to primary database

[DB Manager] ❌ Failed to connect to primary database: Connection timeout
[DB Manager] ⚠️  Failure threshold reached (3/3), failing over to secondary
[DB Manager] ✅ Connected to secondary database (FAILOVER MODE)

[DB Manager] 🔄 Attempting to reconnect to primary database...
[DB Manager] ✅ Primary database reconnected (was down for 180s)
```

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | *(required)* | Primary database connection string |
| `DATABASE_URL_SECONDARY` | *(optional)* | Secondary database connection string - enables hot-swap when set |
| `DB_HEALTH_CHECK_INTERVAL` | `30000` | Health check interval in milliseconds |
| `DB_CONNECTION_TIMEOUT` | `5000` | Connection timeout in milliseconds |
| `DB_FAILURE_THRESHOLD` | `3` | Number of failures before failover |
| `DB_PRIMARY_RETRY_INTERVAL` | `120000` | Time between primary retry attempts when on secondary (ms) |

### Recommended Settings

**Development:**
```bash
DB_HEALTH_CHECK_INTERVAL=10000     # Check every 10 seconds
DB_FAILURE_THRESHOLD=2             # Faster failover
DB_PRIMARY_RETRY_INTERVAL=60000    # Retry every minute
```

**Production:**
```bash
DB_HEALTH_CHECK_INTERVAL=30000     # Check every 30 seconds (default)
DB_FAILURE_THRESHOLD=3             # Avoid false positives (default)
DB_PRIMARY_RETRY_INTERVAL=120000   # Retry every 2 minutes (default)
```

## Data Synchronization

To ensure the hot-swap system is effective, data must be synchronized from the primary (Pi) to the secondary (Cloud) database.

### 1. The Sync Tool (Pi → Cloud)

The application includes a specialized synchronization script that dumps data from the Pi and loads it into the secondary database.

**Run a full sync manually:**
```bash
# On your Pi
npm run db:sync
```

**What it does:**
1. Connects to the Pi Local DB.
2. Dumps all managed tables (Financial Records, Missions, Bulletins, etc.).
3. Connects to `DATABASE_URL_SECONDARY`.
4. Deletes existing records on the secondary and replaces them with Pi data.
5. Verifies record counts on both ends.

### 2. Scheduled Sync (Cron)

For automatic "push" from Pi to Cloud, schedule the sync tool on the Pi to run daily at **2 AM Bangkok time**:

**Using the setup script:**
```bash
# On your Pi
chmod +x ./deployment/scripts/setup-db-sync-cron.sh
./deployment/scripts/setup-db-sync-cron.sh
```

**Manual crontab entry:**
```bash
# Open crontab
crontab -e

# Add a task to sync daily at 2:00 AM
0 2 * * * cd /srv/cc-financial/current && /usr/bin/npm run db:sync >> /srv/cc-financial/logs/db-sync.log 2>&1
```

### 3. Verification Commands

You can check the synchronization status across all databases at any time:

```bash
# Check record counts on Pi, DEV, and SECONDARY
npm run db:sync status
```

## Testing

### Test Failover Locally

1. **Start with both databases running:**
   ```bash
   curl http://localhost:3000/api/health
   # Should show: "currentDatabase": "primary"
   ```

2. **Stop primary database:**
   ```bash
   # On Pi
   sudo systemctl stop postgresql
   ```

3. **Wait for automatic failover (90 seconds max):**
   ```bash
   # Watch logs
   docker logs -f nextjs-app | grep "DB Manager"

   # You should see:
   # [DB Manager] ❌ Failed to connect to primary database
   # [DB Manager] ⚠️  Failure threshold reached
   # [DB Manager] ✅ Connected to secondary database (FAILOVER MODE)
   ```

4. **Verify failover:**
   ```bash
   curl http://localhost:3000/api/health
   # Should show: "currentDatabase": "secondary"
   ```

5. **Restart primary database:**
   ```bash
   sudo systemctl start postgresql
   ```

6. **Wait for automatic failback (2-3 minutes):**
   ```bash
   # Watch logs for:
   # [DB Manager] 🔄 Attempting to reconnect to primary database...
   # [DB Manager] ✅ Primary database reconnected
   ```

## Troubleshooting

### Both Databases Failing

**Symptoms:**
```
Error: Both primary and secondary databases are unavailable
```

**Solutions:**
1. Check network connectivity to both databases
2. Verify connection strings are correct
3. Ensure databases are running
4. Check firewall rules

### Constant Failover Loops

**Symptoms:**
- Logs show continuous switching between databases
- App performance degraded

**Solutions:**
1. Increase `DB_FAILURE_THRESHOLD` to avoid false positives
2. Increase `DB_CONNECTION_TIMEOUT` for slow networks
3. Check database load - may need scaling
4. Verify network stability

### Secondary Database Not Used

**Symptoms:**
- Primary fails but app doesn't switch to secondary
- Logs show no failover attempt

**Solutions:**
1. Verify `DATABASE_URL_SECONDARY` is set in environment
2. Check secondary database is accessible
3. Review application logs for initialization errors
4. Restart application to reload environment variables

### Slow Failover

**Symptoms:**
- Takes too long to detect primary failure
- Extended downtime during failover

**Solutions:**
1. Decrease `DB_HEALTH_CHECK_INTERVAL` for faster detection
2. Decrease `DB_FAILURE_THRESHOLD` for quicker failover
3. Decrease `DB_CONNECTION_TIMEOUT` for faster timeout detection

## Best Practices

### 1. Use Geographic Diversity

Place secondary database in different geographic location:
- **Primary**: On-premises (local Pi)
- **Secondary**: Cloud (different region)

This protects against:
- Local power outages
- ISP failures
- Regional issues

### 2. Monitor Failover Events

Set up alerts for failover events:

```bash
# Example: Discord webhook for failover notifications
# Add to health-monitor.js or create new monitor
```

### 3. Test Regularly

Schedule regular failover tests:
- Monthly: Test manual failover
- Quarterly: Test automatic failback
- Annually: Full disaster recovery drill

### 4. Keep Schemas in Sync

Ensure both databases have identical schemas:
```bash
# After schema changes, update both databases
npx prisma migrate deploy  # Primary
DATABASE_URL=$DATABASE_URL_SECONDARY npx prisma migrate deploy  # Secondary
```

### 5. Consider Costs

Cloud database costs:
- **Neon Free Tier**: 3 GB storage, 10 GB bandwidth
- **Supabase Free Tier**: 500 MB storage, 2 GB bandwidth
- **Production**: Budget $10-50/month for cloud database

## Security Considerations

### Connection Strings

Never commit connection strings to git:
```bash
# ❌ DON'T
DATABASE_URL_SECONDARY="postgresql://user:password@host/db"  # in git

# ✅ DO
DATABASE_URL_SECONDARY="postgresql://user:password@host/db"  # in .env.local (gitignored)
```

### Network Security

Restrict database access:
- Use SSL/TLS for connections
- Whitelist IP addresses
- Use strong passwords
- Enable cloud database firewall

### Backup Security

Encrypt backups:
```bash
# Encrypted backup
pg_dump -h localhost -U ccfinapp cc_financial | \
  openssl enc -aes-256-cbc -salt -out backup.sql.enc
```

## Support

For issues or questions:
1. Check logs: `docker logs nextjs-app | grep "DB Manager"`
2. Test health endpoint: `curl http://localhost:3000/api/health`
3. Review this documentation
4. Check database connection strings and credentials

---

**Pro Tip**: Start with Neon's free tier for testing. It's serverless, has zero maintenance, and perfect for learning hot-swap behavior before committing to a production setup.
