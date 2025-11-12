# MQTT Dashboard Setup for Android

Quick guide to connect your MQTT Dashboard Client app to monitor the CC Church application.

## Connection Settings

Use these settings in your MQTT Dashboard Client app:

### Broker Connection
```
Host/Server: 192.168.68.117
Port: 1883
Protocol: TCP (not SSL/TLS)
```

### Authentication
```
Username: mobile
Password: mobile2025
```

### Client ID
```
Client ID: mobile-dashboard (or leave auto-generated)
```

## Topics to Subscribe

Subscribe to these topics to monitor your church app:

### Main Status
```
homeassistant/sensor/cc-church/status
```
Shows: `healthy` or `unhealthy`

### Response Time
```
homeassistant/sensor/cc-church/response_time
```
Shows: Response time in milliseconds (e.g., `159`)

### Memory Usage
```
homeassistant/sensor/cc-church/memory_mb
```
Shows: Memory usage in MB (e.g., `150`)

### CPU Usage
```
homeassistant/sensor/cc-church/cpu_percent
```
Shows: CPU usage percentage (e.g., `5.3`)

### Container Running
```
homeassistant/sensor/cc-church/container_running
```
Shows: `true` or `false`

### HTTP Available
```
homeassistant/sensor/cc-church/http_available
```
Shows: `true` or `false`

### Uptime
```
homeassistant/sensor/cc-church/uptime
```
Shows: Container uptime in seconds

### Complete Status (JSON)
```
homeassistant/sensor/cc-church/state
```
Shows: Complete JSON with all metrics

## Step-by-Step Setup in MQTT Dashboard Client

### 1. Add New Connection

1. Open MQTT Dashboard Client app
2. Tap the **+** or **Add Connection** button
3. Enter connection details:
   - **Name**: CC Church
   - **Address**: `192.168.68.117`
   - **Port**: `1883`
   - **Username**: `mobile`
   - **Password**: `mobile2025`
4. Tap **Save** or **Connect**

### 2. Create Dashboard Widgets

#### Status Widget
- **Type**: Text/Label
- **Topic**: `homeassistant/sensor/cc-church/status`
- **Name**: App Status
- **Icon**: Choose an appropriate icon

#### Response Time Widget
- **Type**: Gauge or Text
- **Topic**: `homeassistant/sensor/cc-church/response_time`
- **Name**: Response Time
- **Unit**: ms
- **Min**: 0
- **Max**: 2000

#### Memory Usage Widget
- **Type**: Gauge or Progress Bar
- **Topic**: `homeassistant/sensor/cc-church/memory_mb`
- **Name**: Memory
- **Unit**: MB
- **Min**: 0
- **Max**: 512

#### CPU Usage Widget
- **Type**: Gauge or Progress Bar
- **Topic**: `homeassistant/sensor/cc-church/cpu_percent`
- **Name**: CPU Usage
- **Unit**: %
- **Min**: 0
- **Max**: 100

### 3. Subscribe to All Topics

For a wildcard subscription to see all metrics:
```
homeassistant/sensor/cc-church/#
```

The `#` is a wildcard that subscribes to all subtopics.

## Dashboard Layout Suggestions

### Simple Dashboard
```
┌──────────────────────────┐
│ Status: healthy          │
│ Response: 159ms          │
│ Memory: 150MB            │
│ CPU: 5.3%                │
└──────────────────────────┘
```

### Advanced Dashboard
```
┌─────────────┬────────────┐
│ Status      │ Container  │
│ ●  healthy  │ ✓ Running  │
├─────────────┴────────────┤
│ Response Time            │
│ [========>    ] 159ms    │
├──────────────────────────┤
│ Memory Usage             │
│ [=====>       ] 150MB    │
├──────────────────────────┤
│ CPU Usage                │
│ [=>           ] 5.3%     │
├──────────────────────────┤
│ Uptime: 3h 24m           │
└──────────────────────────┘
```

## Color Coding Suggestions

### Status
- **Green**: healthy
- **Red**: unhealthy

### Response Time
- **Green**: < 500ms
- **Yellow**: 500-1000ms
- **Red**: > 1000ms

### Memory
- **Green**: < 200MB
- **Yellow**: 200-300MB
- **Red**: > 300MB

### CPU
- **Green**: < 50%
- **Yellow**: 50-80%
- **Red**: > 80%

## Testing the Connection

### Quick Test

1. In your MQTT Dashboard app, go to the **Subscribe** tab
2. Subscribe to: `homeassistant/sensor/cc-church/status`
3. You should see: `healthy` (updates every 60 seconds)

### If No Messages Appear

**Check network connection:**
- Ensure your phone is on the same network as the Pi
- Try pinging `192.168.68.117` from another device

**Verify MQTT broker:**
```bash
ssh mill@192.168.68.117 'sudo systemctl status mosquitto'
```

**Check health monitor:**
```bash
ssh mill@192.168.68.117 'sudo systemctl status health-monitor'
```

**View health monitor logs:**
```bash
ssh mill@192.168.68.117 'tail -f /home/mill/hosting/health-monitor.log'
```

## Publish Test Message

To test that you can publish (send messages):

1. In your app, go to **Publish** tab
2. **Topic**: `test/message`
3. **Message**: `Hello from mobile`
4. Tap **Publish**

You can verify it worked by SSHing to the Pi:
```bash
ssh mill@192.168.68.117
mosquitto_sub -h localhost -t 'test/#' -u mobile -P mobile2025
```

## Update Frequency

The health monitor publishes updates every **60 seconds** by default.

To change this, edit `/home/mill/hosting/health-monitor.env` on the Pi:
```bash
CHECK_INTERVAL=30000  # 30 seconds
CHECK_INTERVAL=120000 # 2 minutes
```

Then restart:
```bash
sudo systemctl restart health-monitor
```

## Troubleshooting

### "Connection refused"
- Check that you're on the same network as the Pi
- Verify Pi IP address: `192.168.68.117`
- Ensure Mosquitto is running: `sudo systemctl status mosquitto`

### "Authentication failed"
- Double-check username: `mobile`
- Double-check password: `mobile2025`
- Case-sensitive!

### "No messages received"
- Wait 60 seconds (update interval)
- Check health monitor is running: `sudo systemctl status health-monitor`
- Check logs: `tail -f /home/mill/hosting/health-monitor.log`

### "Messages stop after a while"
- This usually means the health monitor service stopped
- Restart it: `sudo systemctl restart health-monitor`

## Accessing from Outside Your Home Network

Currently, MQTT is only accessible on your local network (`192.168.68.117`).

To access from outside:

### Option 1: Use Cloudflare Tunnel (Recommended)
Would require setting up a WebSocket proxy through Cloudflare

### Option 2: Port Forward
Forward port `1883` on your router to `192.168.68.117:1883`
- **Security Note**: Only do this with strong authentication enabled

### Option 3: Use Cloud MQTT Broker
Bridge your local Mosquitto to a cloud MQTT service

## Security Notes

- Change the default password regularly
- Don't expose MQTT port to internet without TLS
- Consider using TLS/SSL for production
- Monitor failed login attempts

## Advanced: Enable TLS/SSL

For encrypted connections (recommended for production):

1. Generate certificates
2. Configure Mosquitto for TLS on port 8883
3. Update mobile app to use SSL/TLS
4. Update health-monitor.env to use `mqtts://`

See the main HEALTH_MONITOR_README.md for details.

## Support

- MQTT Dashboard Client app documentation
- Mosquitto documentation: https://mosquitto.org/documentation/
- Test MQTT broker: test.mosquitto.org (for testing only, no auth)

## Credentials Summary

**For Your MQTT Dashboard App:**
```
Broker: 192.168.68.117
Port: 1883
Username: mobile
Password: mobile2025
Main Topic: homeassistant/sensor/cc-church/#
```

Save this information in your password manager!
