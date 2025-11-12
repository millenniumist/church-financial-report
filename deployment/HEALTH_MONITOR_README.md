# Health Monitor with MQTT

Continuous health monitoring service for the CC Church Next.js application with MQTT publishing for Home Assistant integration.

## Features

- **Container Monitoring**: Checks if Docker container is running
- **HTTP Health Checks**: Monitors app response time and availability
- **System Metrics**: Tracks CPU and memory usage
- **MQTT Publishing**: Publishes metrics to MQTT broker
- **Home Assistant Integration**: Auto-discovery for Home Assistant sensors
- **Systemd Service**: Runs automatically on boot

## Architecture

```
┌─────────────────┐
│  Raspberry Pi   │
│                 │
│  ┌───────────┐  │      ┌──────────────┐
│  │  Next.js  │  │      │ MQTT Broker  │
│  │  Docker   │  │      │ (Mosquitto)  │
│  └─────┬─────┘  │      └──────┬───────┘
│        │        │             │
│  ┌─────▼─────┐  │             │
│  │  Health   │──┼─────────────┘
│  │  Monitor  │  │   MQTT Publish
│  └───────────┘  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Home Assistant  │
│  - Status       │
│  - Response Time│
│  - Memory Usage │
│  - CPU Usage    │
│  - Uptime       │
└─────────────────┘
```

## Quick Setup

1. **Install and configure the health monitor:**
   ```bash
   cd deployment
   chmod +x setup-health-monitor.sh
   ./setup-health-monitor.sh
   ```

2. **The script will:**
   - Install Node.js on the Pi (if not present)
   - Install mqtt npm package
   - Transfer health monitor files
   - Create systemd service
   - Prompt for MQTT broker configuration
   - Start the service

3. **Verify it's running:**
   ```bash
   ssh mill@192.168.68.117 'sudo systemctl status health-monitor'
   ```

## Manual Configuration

If you prefer to configure manually:

1. **Copy the environment template:**
   ```bash
   cp health-monitor.env.example health-monitor.env
   ```

2. **Edit `health-monitor.env`:**
   ```env
   MQTT_BROKER=mqtt://192.168.68.100:1883
   MQTT_USERNAME=your-username
   MQTT_PASSWORD=your-password
   CHECK_INTERVAL=60000  # 60 seconds
   ```

3. **Run the setup script:**
   ```bash
   ./setup-health-monitor.sh
   ```

## MQTT Topics

The health monitor publishes to these topics:

### Main Status
- `homeassistant/sensor/cc-church/state` - Complete JSON health data
- `homeassistant/sensor/cc-church/status` - Overall status (healthy/unhealthy)

### Individual Metrics
- `homeassistant/sensor/cc-church/container_running` - true/false
- `homeassistant/sensor/cc-church/http_available` - true/false
- `homeassistant/sensor/cc-church/response_time` - Response time in ms
- `homeassistant/sensor/cc-church/memory_mb` - Memory usage in MB
- `homeassistant/sensor/cc-church/cpu_percent` - CPU usage percentage
- `homeassistant/sensor/cc-church/uptime` - Container uptime in seconds

## Home Assistant Integration

The health monitor automatically publishes MQTT Discovery configs for Home Assistant.

### Auto-Discovery Sensors

Once the service is running, Home Assistant will automatically discover:

1. **CC Church Status** - Overall health status
2. **CC Church Response Time** - HTTP response time
3. **CC Church Memory Usage** - Container memory usage
4. **CC Church CPU Usage** - Container CPU usage
5. **CC Church Uptime** - Container uptime

### Example Dashboard Card

```yaml
type: entities
title: CC Church Health
entities:
  - entity: sensor.cc_church_status
    name: Status
  - entity: sensor.cc_church_response_time
    name: Response Time
  - entity: sensor.cc_church_memory_usage
    name: Memory
  - entity: sensor.cc_church_cpu_usage
    name: CPU
  - entity: sensor.cc_church_uptime
    name: Uptime
```

### Automations

**Alert when app is down:**
```yaml
automation:
  - alias: "CC Church App Down Alert"
    trigger:
      - platform: state
        entity_id: sensor.cc_church_status
        to: 'unhealthy'
        for: '00:02:00'
    action:
      - service: notify.mobile_app
        data:
          title: "Church App Down"
          message: "The church website is not responding"
```

**Alert on high response time:**
```yaml
automation:
  - alias: "CC Church Slow Response"
    trigger:
      - platform: numeric_state
        entity_id: sensor.cc_church_response_time
        above: 2000  # 2 seconds
        for: '00:05:00'
    action:
      - service: notify.mobile_app
        data:
          title: "Church App Slow"
          message: "Response time is {{ states('sensor.cc_church_response_time') }}ms"
```

## Service Management

### Check Status
```bash
ssh mill@192.168.68.117 'sudo systemctl status health-monitor'
```

### View Logs
```bash
ssh mill@192.168.68.117 'tail -f /home/mill/hosting/health-monitor.log'
```

### Restart Service
```bash
ssh mill@192.168.68.117 'sudo systemctl restart health-monitor'
```

### Stop Service
```bash
ssh mill@192.168.68.117 'sudo systemctl stop health-monitor'
```

### Enable/Disable Auto-start
```bash
# Enable
ssh mill@192.168.68.117 'sudo systemctl enable health-monitor'

# Disable
ssh mill@192.168.68.117 'sudo systemctl disable health-monitor'
```

## Troubleshooting

### Service Not Starting

1. **Check logs:**
   ```bash
   ssh mill@192.168.68.117 'sudo journalctl -u health-monitor -n 50'
   ```

2. **Verify MQTT broker is accessible:**
   ```bash
   ssh mill@192.168.68.117 'ping -c 3 192.168.68.100'
   ```

3. **Test MQTT connection manually:**
   ```bash
   ssh mill@192.168.68.117
   cd /home/mill/hosting
   node health-monitor.js
   ```

### MQTT Not Publishing

1. **Check MQTT credentials in env file:**
   ```bash
   ssh mill@192.168.68.117 'cat /home/mill/hosting/health-monitor.env'
   ```

2. **Subscribe to MQTT topic to verify:**
   ```bash
   mosquitto_sub -h 192.168.68.100 -t 'homeassistant/sensor/cc-church/#' -v
   ```

### Home Assistant Not Discovering

1. **Verify MQTT integration is configured** in Home Assistant
2. **Check MQTT broker connection** in Home Assistant
3. **Restart the health monitor service:**
   ```bash
   ssh mill@192.168.68.117 'sudo systemctl restart health-monitor'
   ```
4. **Check discovery topic:**
   ```bash
   mosquitto_sub -h 192.168.68.100 -t 'homeassistant/sensor/cc_church_+/config' -v
   ```

## Configuration Options

Edit `/home/mill/hosting/health-monitor.env` on the Pi:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:8358` | Next.js app URL |
| `CONTAINER_NAME` | `nextjs-app` | Docker container name |
| `HEALTH_ENDPOINT` | `/api/health` | Health check endpoint |
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `MQTT_TOPIC` | `homeassistant/sensor/cc-church` | Base MQTT topic |
| `MQTT_CLIENT_ID` | `cc-church-health` | MQTT client identifier |
| `MQTT_USERNAME` | `` | MQTT username (optional) |
| `MQTT_PASSWORD` | `` | MQTT password (optional) |
| `CHECK_INTERVAL` | `60000` | Check interval in milliseconds |

After changing configuration:
```bash
ssh mill@192.168.68.117 'sudo systemctl restart health-monitor'
```

## MQTT Broker Setup (Optional)

If you don't have an MQTT broker, you can install Mosquitto on the Pi:

```bash
ssh mill@192.168.68.117

# Install Mosquitto
sudo apt update
sudo apt install -y mosquitto mosquitto-clients

# Enable and start
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Test
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test
```

Configure Mosquitto (optional, for authentication):
```bash
sudo nano /etc/mosquitto/conf.d/default.conf
```

Add:
```
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Create user:
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd your-username
sudo systemctl restart mosquitto
```

## Integration with Deployment

The health monitor is independent of the main deployment script. It runs continuously and monitors the deployed application.

**Deployment flow:**
1. Run `deploy-remote.sh` to deploy the app
2. Run `setup-health-monitor.sh` once to install monitoring
3. Health monitor runs automatically and publishes metrics

## Security Notes

- **MQTT Credentials**: Store MQTT username/password securely in `.env` file
- **Network Access**: Ensure MQTT broker is accessible from Pi
- **Firewall**: Open MQTT port (1883) if needed
- **TLS**: Consider using `mqtts://` for encrypted MQTT connection

## Support

For issues or questions:
1. Check the logs: `/home/mill/hosting/health-monitor.log`
2. Verify service status: `sudo systemctl status health-monitor`
3. Test MQTT connection manually
4. Check Home Assistant MQTT integration

## License

Part of the CC Church Financial application.
