# Cloudflare Worker: External Health Monitor

This Cloudflare Worker monitors your CC Church Application from outside your Pi infrastructure. It runs every minute on Cloudflare's global edge network and sends Discord alerts if your site becomes unreachable.

## Why This Solves the "Pi Down" Problem

The health monitor running on the Pi (`health-monitor.js`) can't send alerts if:
- Pi loses power
- Network connection fails
- Hardware failure
- Raspberry Pi crashes

This Cloudflare Worker runs **completely independently** on Cloudflare's infrastructure, so it will alert you even if the Pi is completely offline.

## Features

- ✅ Checks `https://millenniumist.dpdns.org/api/health` every 1 minute
- ✅ Sends Discord alerts when site becomes unreachable
- ✅ Sends recovery notifications when site comes back
- ✅ 5-minute cooldown to prevent alert spam
- ✅ 15-second timeout (faster detection than on-Pi monitor)
- ✅ Runs on Cloudflare's global edge network (99.99% uptime)
- ✅ Free tier supports up to 100,000 requests/day (1,440 needed for 1-minute checks)

## Prerequisites

1. Cloudflare account (free tier works)
2. Node.js and npm installed locally
3. Your Discord bot token and channel ID (already have these)

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 3. Create KV Namespace

KV (Key-Value) storage is used to remember the last health state (to avoid duplicate alerts).

```bash
cd /Users/suparit/Desktop/code/cc-financial/deployment/cloudflare-worker

# Create production KV namespace
wrangler kv:namespace create "HEALTH_STATE"
```

This will output something like:
```
{ binding = "HEALTH_STATE", id = "abc123def456..." }
```

**Copy the `id` value** and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "HEALTH_STATE"
id = "abc123def456..."  # ← Paste your ID here
```

### 4. Set Discord Credentials as Secrets

```bash
# Set Discord bot token
wrangler secret put DISCORD_BOT_TOKEN
# When prompted, paste the value from deployment/.env (DISCORD_BOT_TOKEN)

# Set Discord channel ID
wrangler secret put DISCORD_CHANNEL_ID
# When prompted, paste deployment/.env's DISCORD_CHANNEL_ID
```

### 5. Deploy the Worker

```bash
wrangler deploy
```

Output should show:
```
✨ Built successfully!
✨ Uploaded worker successfully!
✨ Published cc-church-health-watcher
  https://cc-church-health-watcher.YOUR_SUBDOMAIN.workers.dev
```

### 6. Verify Deployment

The worker runs automatically via cron trigger (every minute). You can also test it manually:

```bash
# Visit the worker URL in your browser to see current status
open https://cc-church-health-watcher.YOUR_SUBDOMAIN.workers.dev
```

Or test via curl:
```bash
curl https://cc-church-health-watcher.YOUR_SUBDOMAIN.workers.dev
```

## Monitoring the Worker

### Check Worker Logs

```bash
wrangler tail
```

This shows real-time logs from your worker. You'll see:
```
Health check: {"available":true,"statusCode":200,"responseTime":123,"timestamp":"2025-11-14T..."}
```

### Check Worker Metrics

1. Go to: https://dash.cloudflare.com/
2. Navigate to: **Workers & Pages** → **cc-church-health-watcher**
3. Click **Metrics** tab to see:
   - Number of requests
   - Error rate
   - CPU time
   - Success rate

### Check KV State

```bash
# View current state
wrangler kv:key get --binding=HEALTH_STATE "lastState"
```

## Testing

### Test Failure Alert

Temporarily stop your Pi to trigger an alert:

```bash
# On your Mac
ssh mill@192.168.68.117 "docker stop nextjs-app"

# Wait 1-2 minutes, you should receive Discord alert
# Then restart:
ssh mill@192.168.68.117 "docker start nextjs-app"

# Wait 1-2 minutes, you should receive recovery notification
```

### Manual Test via HTTP

You can trigger a manual check by visiting the worker URL:

```bash
curl https://cc-church-health-watcher.YOUR_SUBDOMAIN.workers.dev
```

This returns the current health status and last state without triggering alerts.

## How It Works

### Cron Schedule

The worker runs via cron trigger defined in `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

### State Management

Uses Cloudflare KV to track state:

```javascript
{
  "status": "healthy" | "unhealthy",
  "lastAlertTime": 1234567890,
  "timestamp": "2025-11-14T..."
}
```

This prevents duplicate alerts and enables recovery notifications.

### Alert Logic

1. **Unhealthy Alert**: Sent if:
   - Site becomes unreachable AND (state changed OR 5-minute cooldown expired)

2. **Recovery Alert**: Sent if:
   - Site becomes reachable AND previous state was unhealthy

### Timeout

The worker uses a 15-second timeout (vs 5 seconds on Pi). This is more appropriate for external monitoring as network latency can be higher.

## Updating the Worker

After making changes to `health-watcher.js`:

```bash
cd /Users/suparit/Desktop/code/cc-financial/deployment/cloudflare-worker
wrangler deploy
```

Changes are deployed globally in seconds.

## Cost

**Free Tier Limits:**
- 100,000 requests/day (you'll use ~1,440 for 1-minute checks)
- 10ms CPU time per request
- Unlimited KV reads (1,000 writes/day free - you'll use ~1,440)

**Estimated Cost:** $0/month (well within free tier)

If you exceed free tier:
- $0.50 per million requests
- $0.50 per million KV writes

**Your usage:** ~43,200 checks/month = **$0.02/month** if you exceeded free tier (but you won't)

## Disabling the Worker

### Temporarily Pause

```bash
# Disable cron triggers
wrangler deploy --no-bundle --triggers=""
```

### Completely Delete

```bash
wrangler delete
```

## Troubleshooting

### Worker Not Running

Check cron triggers:
```bash
wrangler deployments list
```

### No Alerts Received

1. Check Discord credentials:
   ```bash
   wrangler secret list
   ```

2. View logs:
   ```bash
   wrangler tail
   ```

3. Check KV state:
   ```bash
   wrangler kv:key get --binding=HEALTH_STATE "lastState"
   ```

### False Alerts

If you get alerts but site is accessible:
- Check if Cloudflare Tunnel has rate limiting
- Increase timeout in `health-watcher.js` (CONFIG.TIMEOUT)

## Dual Monitoring Setup

Now you have **two layers of monitoring**:

1. **On-Pi Monitor** (`health-monitor.js`):
   - Checks every 60 seconds
   - Monitors container, HTTP, memory, CPU
   - Sends MQTT metrics to Home Assistant
   - Sends Discord alerts for application issues

2. **External Monitor** (Cloudflare Worker):
   - Checks every 60 seconds from outside
   - Monitors public internet accessibility
   - Sends Discord alerts if **entire Pi is down**
   - Different alert message to distinguish source

You'll receive different alert messages:
- On-Pi: "🚨 CC Church Application Health Alert"
- External: "🚨 CC Church Application Down (External Monitor)"

This comprehensive monitoring ensures you're alerted regardless of whether the issue is:
- Application crash (on-Pi detects)
- Pi down (external detects)
- Network issue (external detects)
- Power outage (external detects)

## Support

For issues with Cloudflare Workers:
- Docs: https://developers.cloudflare.com/workers/
- Community: https://community.cloudflare.com/
- Wrangler: https://github.com/cloudflare/workers-sdk
