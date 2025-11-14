# Health Monitoring Documentation

Complete guide for health monitoring and alerting for the CC Financial Application.

## Overview

The health monitoring system provides:
1. **Continuous Health Checks** - Monitors application, container, and database status
2. **MQTT Publishing** - Publishes metrics to MQTT broker for Home Assistant integration
3. **Discord Alerts** - Sends notifications to Discord when application health is abnormal
4. **Filtered Logging** - Health check endpoints are excluded from Elasticsearch logs

## Quick Start

### Enable Discord Notifications

Your Discord bot is already configured! You just need to get the channel ID where you want to receive alerts.

1. **Enable Developer Mode in Discord:**
   - Open Discord → User Settings → App Settings → Advanced
   - Enable "Developer Mode"

2. **Get the Channel ID:**
   - Right-click on the channel where you want health alerts
   - Click "Copy Channel ID"
   - This gives you a long number like `1234567890123456789`

3. **Configure the channel ID in deployment/.env:**
   ```bash
   DISCORD_CHANNEL_ID="1234567890123456789"
   ```

4. **Deploy to Pi:**
   ```bash
   ./deployment/deploy-remote.sh
   ```

That's it! The health monitor will automatically send Discord alerts to that channel when issues are detected.

## How It Works

### Health Check Components

The health monitor checks:
- **Container Status** - Is the Next.js container running?
- **HTTP Availability** - Does the application respond to health endpoint?
- **Response Time** - How long does the health endpoint take to respond?
- **Memory Usage** - Current memory consumption
- **CPU Usage** - Current CPU utilization

### Discord Notifications

**Alert Triggers:**
- Container stopped or crashed
- HTTP endpoint unavailable or timing out
- State changes from healthy to unhealthy

**Alert Cooldown:**
- 5 minutes between duplicate alerts
- Prevents notification spam during temporary issues

**Recovery Notifications:**
- Sent when application recovers from unhealthy state
- Confirms the issue is resolved

**Alert Example:**

🚨 **CC Church Application Health Alert**

The application health check detected an issue

| Field | Value |
|-------|-------|
| Overall Status | `UNHEALTHY` |
| Container | ❌ Stopped |
| HTTP | ❌ Unavailable |
| Memory Usage | 0 MB |
| CPU Usage | 0.0% |
| Timestamp | 2025-01-14 10:30:00 |

### Elasticsearch Log Filtering

Health check endpoints (`/api/health`, `/health`) are **automatically excluded** from Elasticsearch logs to:
- Reduce log clutter
- Save Elasticsearch storage space
- Improve log readability
- Focus on actual application activity

Health checks still run every 60 seconds, but they won't appear in your Kibana logs.

## Configuration

### Environment Variables

**In `deployment/.env`:**

```bash
# Health Monitor Configuration
ENABLE_HEALTH_MONITOR=true           # Enable/disable health monitoring
APP_URL=http://localhost:8358        # Application URL to monitor
CONTAINER_NAME=nextjs-app            # Docker container name
HEALTH_ENDPOINT=/api/health          # Health check endpoint
CHECK_INTERVAL=60000                 # Check interval in milliseconds (60s)

# Discord Bot Configuration (already set up!)
DISCORD_BOT_TOKEN=MTQ...              # Your Discord bot token
DISCORD_CHANNEL_ID=""                # Channel ID for health alerts (get from Discord)

# MQTT Configuration (for Home Assistant)
MQTT_BROKER=mqtt://192.168.68.117:1883
MQTT_TOPIC=homeassistant/sensor/cc-church
MQTT_USERNAME=ccchurch
MQTT_PASSWORD=ccchurch2025
```

### Adjust Check Interval

To change how often health checks run:

```bash
# Check every 30 seconds
CHECK_INTERVAL=30000

# Check every 2 minutes
CHECK_INTERVAL=120000
```

### Disable Discord Alerts

To disable Discord notifications (only use MQTT):

```bash
DISCORD_CHANNEL_ID=""
```

## Monitoring and Troubleshooting

### View Health Monitor Logs

```bash
ssh mill@192.168.68.117

# View health monitor service status
sudo systemctl status health-monitor

# View recent logs
sudo journalctl -u health-monitor -n 50 --no-pager

# Follow logs in real-time
sudo journalctl -u health-monitor -f
```

### Health Monitor Output

Normal operation looks like:
```
🏥 CC Church Health Monitor
============================
Configuration:
  App URL: http://localhost:8358
  Container: nextjs-app
  MQTT Broker: mqtt://192.168.68.117:1883
  MQTT Topic: homeassistant/sensor/cc-church
  Discord Alerts: ✓ Enabled
  Check Interval: 60s
============================

🔌 Connecting to MQTT broker: mqtt://192.168.68.117:1883
✓ Connected to MQTT broker
📡 Publishing Home Assistant discovery configs...
✓ Home Assistant discovery published
⏱️  Starting health checks every 60s
🔍 Performing health check...
  Status: HEALTHY
  Container: running
  HTTP: 45ms
  Memory: 256MB
  CPU: 2.3%
✓ Published to MQTT
```

### Test Discord Bot

Manually test the Discord bot (replace with your values):

```bash
curl -X POST "https://discord.com/api/v10/channels/YOUR_CHANNEL_ID/messages" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Testing Discord bot from CC Church"
  }'
```

If successful, you'll see a message in your Discord channel.

### Common Issues

#### Discord Alerts Not Sending

1. **Check bot token and channel ID are configured:**
   ```bash
   ssh mill@192.168.68.117
   cat /home/mill/hosting/health-monitor.env | grep DISCORD
   ```

2. **Verify bot has permissions:**
   - Make sure the bot is added to your Discord server
   - Ensure the bot has permission to send messages in the channel
   - Test the bot manually (see above)

3. **Check health monitor logs:**
   ```bash
   sudo journalctl -u health-monitor -n 100 | grep -i discord
   ```

#### Health Checks Failing

1. **Container not running:**
   ```bash
   docker ps | grep nextjs-app
   docker logs nextjs-app
   ```

2. **Health endpoint not responding:**
   ```bash
   curl http://localhost:8358/api/health
   ```

3. **MQTT connection issues:**
   ```bash
   sudo systemctl status mosquitto
   ```

#### Health Logs in Elasticsearch

If you're still seeing health check logs in Elasticsearch:

1. **Verify logger filter is active:**
   - Check `lib/logger.js` has the health check filter
   - Redeploy the application

2. **Clear old logs:**
   ```bash
   # On your Pi, clear Elasticsearch index
   curl -X DELETE "http://localhost:9200/cc-church-logs*"
   ```

## Integration with Home Assistant

The health monitor publishes metrics to MQTT for Home Assistant:

**Sensors Created:**
- `sensor.cc_church_status` - Overall health status
- `sensor.cc_church_response_time` - HTTP response time (ms)
- `sensor.cc_church_memory_usage` - Memory usage (MB)
- `sensor.cc_church_cpu_usage` - CPU usage (%)
- `sensor.cc_church_uptime` - Container uptime (seconds)

**Home Assistant Automation Example:**

```yaml
automation:
  - alias: "Alert on CC Church Down"
    trigger:
      - platform: state
        entity_id: sensor.cc_church_status
        to: 'unhealthy'
    action:
      - service: notify.mobile_app
        data:
          title: "CC Church Alert"
          message: "Application is unhealthy!"
```

## Advanced Configuration

### Multiple Discord Channels

The current setup sends alerts to a single channel. To send to multiple channels:

```bash
# Currently supports one channel
DISCORD_CHANNEL_ID="1234567890123456789"

# For multiple channels, you would need to:
# 1. Modify health-monitor.js to send to multiple channels
# 2. Or use Discord's channel forwarding features
# 3. Or set up channel webhooks for forwarding
```

### Custom Alert Cooldown

Edit `deployment/health-monitor.js` to change cooldown:

```javascript
const ALERT_COOLDOWN = 600000; // 10 minutes (default: 5 minutes)
```

### Health Check Timeout

Adjust HTTP timeout in `health-monitor.js`:

```javascript
const timeout = setTimeout(() => {
  resolve({
    available: false,
    responseTime: -1,
    error: 'timeout'
  });
}, 10000); // 10 seconds (default: 5 seconds)
```

## Support

For issues or questions:
1. Check health monitor logs: `sudo journalctl -u health-monitor -n 100`
2. Verify Discord bot token and channel ID in deployment/.env
3. Test the bot manually
4. Ensure bot has message permissions in the channel
5. Check container and application logs
