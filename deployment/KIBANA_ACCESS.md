# Kibana Log Viewer - Remote Access Guide

Kibana is the web UI for viewing Elasticsearch logs. Access it from anywhere using these methods:

## ✅ Access Methods

### 1. **Local Network** (at home/office)
```
http://192.168.68.117:5601
```

### 2. **Tailscale** (from anywhere - recommended)
```
http://100.110.210.24:5601
```

**Setup:**
1. Install Tailscale app on your device (phone, laptop)
2. Login with same account
3. Navigate to the Tailscale IP above

### 3. **Cloudflare Tunnel** (optional - public web access)

To access via a nice URL like `https://logs.millenniumist.dpdns.org`:

#### Step 1: Update Cloudflare Tunnel Config

Edit `deployment/cloudflare/config.yml` and add:

```yaml
ingress:
  - hostname: millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: www.millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: logs.millenniumist.dpdns.org
    service: http://localhost:5601
  - hostname: ssh.millenniumist.dpdns.org
    service: ssh://localhost:22
  - service: http_status:404
```

#### Step 2: Add DNS Record

In Cloudflare dashboard:
1. Go to DNS settings
2. Add CNAME record:
   - Name: `logs`
   - Target: `<your-tunnel-id>.cfargotunnel.com`
   - Proxied: Yes

#### Step 3: Restart Cloudflare Tunnel

```bash
ssh mill@192.168.68.117
pkill cloudflared
cd /home/mill/hosting
nohup cloudflared tunnel --config cloudflare/config.yml run > cloudflared.log 2>&1 &
```

Now access at: **https://logs.millenniumist.dpdns.org**

## 🎯 Using Kibana

### First Time Setup

1. **Open Kibana** (via any method above)
2. Click **"Explore on my own"**
3. Go to **Menu → Management → Stack Management**
4. Click **Index Patterns**
5. Create index pattern:
   - Pattern: `cc-church-logs*`
   - Click **Next**
   - Time field: `@timestamp` or `time`
   - Click **Create**

### View Logs

1. Go to **Menu → Analytics → Discover**
2. Select `cc-church-logs*` index
3. You'll see all logs with:
   - Timestamp
   - Log level (info, error, warn)
   - Message
   - Metadata (method, url, status, etc.)

### Search Logs

**By log level:**
```
level: "error"
level: "info"
```

**By type:**
```
type: "health-check"
type: "request"
type: "response"
```

**By status:**
```
status: "unhealthy"
database: "disconnected"
```

**By time range:**
- Use time picker at top-right
- Select "Last 15 minutes", "Last hour", "Last 24 hours", etc.

### Create Visualizations

1. Go to **Menu → Analytics → Dashboard**
2. Click **Create dashboard**
3. Add visualizations:
   - Error rate over time
   - Response time distribution
   - API endpoint usage
   - Database health status

## 🔒 Security Recommendations

If using Cloudflare Tunnel for public access:

### Option 1: Cloudflare Access (Recommended)

Add authentication via Cloudflare Access:

1. Go to Cloudflare Zero Trust dashboard
2. Add application:
   - Subdomain: `logs`
   - Domain: `millenniumist.dpdns.org`
3. Create access policy:
   - Allow: Your email
   - Or use Google/GitHub login

### Option 2: Basic Auth

Add to `cloudflare/config.yml`:

```yaml
  - hostname: logs.millenniumist.dpdns.org
    service: http://localhost:5601
    originRequest:
      noTLSVerify: true
      httpHostHeader: localhost
```

Then configure basic auth in Kibana config (more complex).

## 📊 Useful Kibana Features

### 1. **Saved Searches**
Save frequently used search queries for quick access

### 2. **Dashboards**
Create custom dashboards with multiple visualizations

### 3. **Alerts**
Set up alerts for:
- High error rates
- Database connection failures
- Slow response times

### 4. **Export**
Export logs to CSV/JSON for offline analysis

## 🐛 Troubleshooting

### Kibana Won't Load

Check container status:
```bash
ssh mill@192.168.68.117
docker ps | grep kibana
docker logs kibana
```

Restart if needed:
```bash
docker restart kibana
```

### No Data in Kibana

1. Check Elasticsearch is receiving logs:
```bash
curl http://192.168.68.117:9200/cc-church-logs/_count
```

2. Check app is logging:
```bash
docker logs nextjs-app | tail -20
```

3. Verify Elasticsearch environment:
```bash
docker exec nextjs-app env | grep ELASTICSEARCH
```

### Slow Performance

Kibana needs ~500MB RAM. If Pi is slow:
- Close other applications
- Limit log retention (delete old indices)
- Access via Tailscale instead of Cloudflare (faster)

## 📱 Mobile Access

### Via Tailscale (Best)
1. Install Tailscale on phone
2. Connect to network
3. Open browser to `http://100.110.210.24:5601`

### Via Cloudflare Tunnel
1. Open browser to `https://logs.millenniumist.dpdns.org`
2. Login if using Cloudflare Access

## 🎨 Kibana Tips

- **Dark Mode**: Settings → Appearance → Dark theme
- **Refresh**: Auto-refresh every 5s, 10s, 30s, etc.
- **Columns**: Customize which fields to show
- **Filters**: Add multiple filters for complex queries
- **Share**: Share searches and dashboards via URL

---

**Quick Access Summary:**
- Local: http://192.168.68.117:5601
- Tailscale: http://100.110.210.24:5601
- Public (optional): https://logs.millenniumist.dpdns.org
