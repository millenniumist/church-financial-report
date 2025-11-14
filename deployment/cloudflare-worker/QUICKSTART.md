# Quick Start - 5 Minutes to External Monitoring

This guide gets your external health monitor running in 5 minutes.

## What This Does

Monitors your site from Cloudflare's global network and alerts you on Discord if your **entire Pi goes down** (power outage, network failure, hardware crash, etc.).

## Prerequisites

- Cloudflare account (free tier is fine)
- Node.js installed on your Mac

## Step 1: Install Wrangler

```bash
npm install -g wrangler
```

## Step 2: Deploy

```bash
cd /Users/suparit/Desktop/code/cc-financial/deployment/cloudflare-worker
./deploy.sh
```

The script will:
1. Login to Cloudflare (opens browser)
2. Create KV storage namespace
3. Ask for Discord credentials (paste from deployment/.env)
4. Deploy the worker

**Discord Bot Token** (when prompted): copy the value from `deployment/.env` (`DISCORD_BOT_TOKEN`).

**Discord Channel ID** (when prompted): copy `DISCORD_CHANNEL_ID` from `deployment/.env`.

## Step 3: Test

Stop your Pi to test:

```bash
ssh mill@192.168.68.117 "docker stop nextjs-app"
```

Wait 1-2 minutes → You should receive a Discord alert!

Restart:
```bash
ssh mill@192.168.68.117 "docker start nextjs-app"
```

Wait 1-2 minutes → You should receive a recovery notification!

## Done!

You now have dual monitoring:
- **On-Pi Monitor**: Detects app crashes, memory issues, etc.
- **External Monitor**: Detects Pi down, network failures, etc.

## View Logs

```bash
wrangler tail
```

## Common Issues

**"wrangler: command not found"**
```bash
npm install -g wrangler
```

**"Not authenticated"**
```bash
wrangler login
```

**"KV namespace not found"**
- The deploy.sh script creates this automatically
- Or run manually: `wrangler kv:namespace create "HEALTH_STATE"`

## Manual Deployment

If the automated script has issues, follow the detailed instructions in [README.md](./README.md).
