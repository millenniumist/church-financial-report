# Cloudflare Tunnel Configuration

This directory contains all Cloudflare Tunnel configuration for the self-hosted deployment.

## Files

- `config.yml` - Tunnel configuration (gitignored, contains sensitive paths)
- `config.example.yml` - Template for creating your own config
- `*.json` - Tunnel credentials (gitignored, NEVER commit)
- `cert.pem` - Cloudflare certificate (gitignored)

## First-Time Setup

### 1. Login to Cloudflare

```bash
cloudflared tunnel login
```

This creates `~/.cloudflared/cert.pem`. Copy it to this directory:

```bash
cp ~/.cloudflared/cert.pem /Users/suparit/Desktop/code/hosting/cloudflare/
```

### 2. Create a Tunnel

```bash
cloudflared tunnel create millenniumist
```

This creates a credentials JSON file. Copy it to this directory:

```bash
cp ~/.cloudflared/<tunnel-id>.json /Users/suparit/Desktop/code/hosting/cloudflare/
```

### 3. Configure DNS

Point your domain to the tunnel:

```bash
cloudflared tunnel route dns millenniumist millenniumist.dpdns.org
cloudflared tunnel route dns millenniumist www.millenniumist.dpdns.org
```

### 4. Create config.yml

Copy the example and update with your tunnel ID:

```bash
cd /Users/suparit/Desktop/code/hosting/cloudflare
cp config.example.yml config.yml
```

Edit `config.yml` and set:
- `tunnel: YOUR_TUNNEL_ID`
- `credentials-file: /Users/suparit/Desktop/code/hosting/cloudflare/YOUR_TUNNEL_ID.json`
- `hostname: your-domain.com`

## Existing Setup

If you already have a tunnel configured in `~/.cloudflared/`, copy the files here:

```bash
# From the hosting repo root
cp ~/.cloudflared/config.yml cloudflare/
cp ~/.cloudflared/*.json cloudflare/
cp ~/.cloudflared/cert.pem cloudflare/

# Update the credentials-file path in config.yml to point to this directory
```

## Running the Tunnel

The `deploy-local.sh` script automatically:
1. Stops any existing cloudflared process
2. Starts the tunnel using `cloudflare/config.yml`
3. Logs output to `cloudflared.log`

### Manual Control

Start tunnel:
```bash
cloudflared tunnel --config /Users/suparit/Desktop/code/hosting/cloudflare/config.yml run millenniumist
```

Stop tunnel:
```bash
pkill cloudflared
```

Check status:
```bash
pgrep cloudflared && echo "Running" || echo "Stopped"
```

View logs:
```bash
tail -f /Users/suparit/Desktop/code/hosting/cloudflared.log
```

## Troubleshooting

### Tunnel won't start
- Check credentials file exists: `ls -la cloudflare/*.json`
- Verify config.yml paths are absolute
- Check logs: `tail -f cloudflared.log`

### Connection issues
- Verify tunnel is running: `pgrep cloudflared`
- Check DNS propagation: `nslookup millenniumist.dpdns.org`
- Test local app: `curl http://localhost:8358`

### Permission errors
- Ensure credentials file has correct permissions: `chmod 600 cloudflare/*.json`
- Ensure cert.pem is readable: `chmod 600 cloudflare/cert.pem`

## Security Notes

- **NEVER commit** `config.yml`, `*.json`, or `*.pem` files
- These files are in `.gitignore` for safety
- Only commit `config.example.yml` and this README
- Rotate credentials if accidentally exposed
