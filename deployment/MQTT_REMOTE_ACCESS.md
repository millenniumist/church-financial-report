# MQTT Remote Access via Cloudflare Tunnel

Guide to access your MQTT broker from anywhere using Cloudflare Tunnel.

## Current Setup

**Local Network Only:**
- MQTT Broker: `mqtt://192.168.68.117:1883`
- Works when connected to home WiFi
- Cannot access from outside network

## Options for Remote Access

### Option 1: MQTT over WebSockets (Recommended)

Setup Mosquitto to support WebSocket connections and proxy them through Cloudflare tunnel.

#### Prerequisites
- Mosquitto with WebSocket support
- Nginx or similar proxy
- Cloudflare tunnel already configured

#### Steps

1. **Configure Mosquitto for WebSockets:**

```bash
ssh mill@192.168.68.117

# Edit Mosquitto config
sudo nano /etc/mosquitto/conf.d/websockets.conf
```

Add:
```
# WebSocket listener
listener 9001
protocol websockets
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Restart Mosquitto:
```bash
sudo systemctl restart mosquitto
```

2. **Update Cloudflare Tunnel Config:**

Add WebSocket route to `cloudflare/config.yml`:
```yaml
ingress:
  - hostname: millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: www.millenniumist.dpdns.org
    service: http://localhost:8358
  - hostname: mqtt.millenniumist.dpdns.org
    service: http://localhost:9001
    originRequest:
      noTLSVerify: true
  - hostname: ssh.millenniumist.dpdns.org
    service: ssh://localhost:22
  - service: http_status:404
```

3. **Add DNS Record:**

In Cloudflare dashboard, add CNAME:
- Name: `mqtt`
- Target: `<tunnel-id>.cfargotunnel.com`
- Proxied: Yes

4. **Connect from Android App:**

Change connection settings:
- Protocol: **WebSocket** (not TCP)
- Host: `wss://mqtt.millenniumist.dpdns.org`
- Port: `443` (HTTPS/WSS)
- Path: `/mqtt` (or `/` depending on app)
- Username: `mobile`
- Password: `mobile2025`

### Option 2: VPN Access (Simpler, More Secure)

Use a VPN to access your home network remotely.

#### WireGuard on Raspberry Pi

1. **Install WireGuard:**
```bash
ssh mill@192.168.68.117
sudo apt update && sudo apt install wireguard
```

2. **Configure WireGuard Server:**
Follow standard WireGuard setup guides for Raspberry Pi

3. **Connect from Phone:**
- Install WireGuard app on Android
- Import configuration
- Connect to VPN
- Use local MQTT broker: `mqtt://192.168.68.117:1883`

**Benefits:**
- Full access to home network
- More secure than exposing MQTT
- Can access other local services

### Option 3: Tailscale (Easiest VPN)

1. **Install Tailscale on Pi:**
```bash
ssh mill@192.168.68.117
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

2. **Install Tailscale on Phone:**
- Install Tailscale app
- Login with same account
- Connect

3. **Use Tailscale IP:**
```
Get Pi's Tailscale IP: tailscale ip -4
Connect MQTT to: mqtt://100.x.x.x:1883
```

**Benefits:**
- Dead simple setup
- Automatic encryption
- Works across NAT
- Access from anywhere

### Option 4: Port Forwarding (Not Recommended)

⚠️  **Security Warning**: Exposing MQTT port to internet without TLS is risky.

If you must:
1. Forward port 8883 (MQTT with TLS) on your router
2. Setup TLS certificates for Mosquitto
3. Use strong passwords
4. Monitor for intrusion attempts

## Recommendation

**For your use case (Android MQTT dashboard from anywhere):**

1. **Immediate solution**: Use **Tailscale** (Option 3)
   - Install in 5 minutes
   - Just works
   - Secure by default

2. **Long-term solution**: Setup **MQTT over WebSockets** (Option 1)
   - Better for Home Assistant integration
   - Uses existing Cloudflare infrastructure
   - Professional setup

## Implementation Status

**Current State:**
- ✅ MQTT broker running locally
- ✅ Health monitor publishing metrics
- ✅ Android app works on local network

**To Enable Remote Access:**
- ⏳ Choose Option 1, 2, or 3 above
- ⏳ Follow implementation steps
- ⏳ Test from outside network

## Quick Start: Tailscale Setup

Since this is the easiest, here's the complete setup:

### On Raspberry Pi:
```bash
ssh mill@192.168.68.117

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Get your Tailscale IP
tailscale ip -4
# Output example: 100.64.123.45
```

### On Android:
1. Install **Tailscale** from Google Play
2. Login with same account
3. Connect

### In MQTT Dashboard App:
```
Broker: mqtt://100.64.123.45:1883  (use your Tailscale IP)
Port: 1883
Username: mobile
Password: mobile2025
```

Now you can monitor from anywhere!

## Testing Remote Access

Once setup, test from mobile data (not WiFi):

1. Disconnect from WiFi
2. Enable mobile data
3. Connect Tailscale (if using Option 2/3)
4. Open MQTT Dashboard app
5. Subscribe to: `homeassistant/sensor/cc-church/status`
6. Wait 60 seconds for update

## Troubleshooting

### WebSocket Connection Issues
- Check Cloudflare tunnel logs
- Verify WebSocket listener in Mosquitto
- Test with: `wscat -c wss://mqtt.your-domain.com`

### VPN Connection Issues
- Verify VPN is connected
- Check firewall rules
- Ping the Pi: `ping 192.168.68.117` or Tailscale IP

### Still Using Local IP
- Verify you're not on home WiFi
- Check VPN status
- Confirm using correct IP address

## Security Best Practices

1. **Strong Passwords**: Change default MQTT passwords
2. **TLS/SSL**: Use encryption for public-facing connections
3. **Firewall**: Only expose necessary ports
4. **Monitor Logs**: Check for unauthorized access attempts
5. **Regular Updates**: Keep Mosquitto and OS updated

## Next Steps

1. **Choose your access method** (Tailscale recommended for quick setup)
2. **Implement the solution** following steps above
3. **Test from remote location**
4. **Update MQTT_ANDROID_SETUP.md** with your chosen method
5. **Monitor and enjoy** your remote church app monitoring!

## Support

- Tailscale Docs: https://tailscale.com/kb/
- Mosquitto WebSocket: https://mosquitto.org/man/mosquitto-conf-5.html
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

**Quick Answer to Your Question:**
Install Tailscale on your Pi and phone - you'll be able to access MQTT from anywhere in 5 minutes!
