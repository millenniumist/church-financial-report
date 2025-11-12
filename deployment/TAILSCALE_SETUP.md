# Tailscale Setup for Remote MQTT Access

## ✅ Installation Complete!

Tailscale has been installed on your Raspberry Pi.

## 🔐 Authentication Required

**Please authenticate your Raspberry Pi by visiting:**

```
https://login.tailscale.com/a/a1a8763016235
```

### Steps:

1. **Open the link above** in your browser
2. **Login** with your Tailscale account
   - Don't have an account? Create one (it's free!)
3. **Approve** the device connection when prompted
4. **Wait** a few seconds for connection to establish

## After Authentication

Once you've authenticated, run these commands to get your Tailscale IP:

```bash
cd deployment
ssh mill@192.168.68.117 'sudo tailscale status'
ssh mill@192.168.68.117 'sudo tailscale ip -4'
```

You'll get an IP like: `100.64.123.45`

## Configure Android MQTT Dashboard

### When at Home (Local Network):
```
Host: mqtt://192.168.68.117:1883
Port: 1883
Username: mobile
Password: mobile2025
```

### From Anywhere (via Tailscale):

1. **Install Tailscale on Android**
   - Download from Google Play Store
   - Login with same account
   - Connect to your Tailscale network

2. **Configure MQTT Dashboard**
   ```
   Host: mqtt://100.x.x.x:1883  (use your Tailscale IP)
   Port: 1883
   Username: mobile
   Password: mobile2025
   Topic: homeassistant/sensor/cc-church/#
   ```

3. **Test from anywhere!**
   - Disconnect from WiFi
   - Use mobile data
   - Tailscale will connect you securely to your home network
   - MQTT Dashboard will work as if you're at home!

## Verification

After authentication, verify Tailscale is working:

```bash
# On Pi
ssh mill@192.168.68.117 'sudo tailscale status'

# Should show:
# 100.x.x.x   raspberrypi    mill@        linux   -
```

## MQTT Topics Available

Subscribe to any of these:
```
homeassistant/sensor/cc-church/status           → healthy/unhealthy
homeassistant/sensor/cc-church/response_time    → 63ms
homeassistant/sensor/cc-church/memory_mb        → 150MB  
homeassistant/sensor/cc-church/cpu_percent      → 5.3%
homeassistant/sensor/cc-church/#                → All metrics
```

## Benefits of Tailscale

- ✅ **Secure**: Encrypted connections
- ✅ **Easy**: No port forwarding needed
- ✅ **Fast**: Direct peer-to-peer when possible
- ✅ **Free**: For personal use
- ✅ **Cross-platform**: Works on all devices
- ✅ **No configuration**: Just install and authenticate

## Troubleshooting

### "Device not showing up"
- Make sure you completed authentication
- Check: `sudo systemctl status tailscaled`
- Restart: `sudo systemctl restart tailscaled`

### "Cannot connect from Android"
- Ensure Tailscale app is connected on phone
- Check Pi's Tailscale IP: `tailscale ip -4`
- Verify MQTT broker is accessible locally first

### "Connection refused"
- Ping the Tailscale IP from phone
- Check Mosquitto is running: `sudo systemctl status mosquitto`
- Verify firewall allows port 1883

## Next Steps

1. ✅ Tailscale installed on Pi
2. ⏳ Complete authentication (visit URL above)
3. ⏳ Install Tailscale on Android
4. ⏳ Get Tailscale IP from Pi
5. ⏳ Configure MQTT Dashboard with Tailscale IP
6. ⏳ Test from anywhere!

---

**Current Status**: Waiting for authentication at the URL above
