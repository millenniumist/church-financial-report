# 🚀 Quick Reference - Cloudflare Tunnel & Deployment

## ✅ Current Status (All Working!)

| Item | Status |
|------|--------|
| **Website** | ✅ https://millenniumist.dpdns.org (HTTP 200) |
| **Tunnel** | ✅ Running with systemd auto-start |
| **Docker** | ✅ nextjs-app container running |
| **Auto-Start** | ✅ Enabled (survives reboots) |
| **Env Sync** | ✅ deployment/.env synchronized |

---

## 🔧 Common Commands

### Deploy Updates
```bash
cd /Users/suparit/Desktop/code/cc-financial
./deployment/deploy-remote.sh
```
This will:
- Sync latest code
- Rebuild Docker container
- Ensure tunnel auto-start is set up

### Check Website Status
```bash
curl -I https://millenniumist.dpdns.org
```

### SSH to Remote Server
```bash
ssh mill@192.168.68.117
# Password: 0000
```

### Check Tunnel Status
```bash
ssh mill@192.168.68.117
sudo systemctl status cloudflared
```

### Restart Tunnel
```bash
ssh mill@192.168.68.117
sudo systemctl restart cloudflared
```

### View Tunnel Logs
```bash
ssh mill@192.168.68.117
tail -f /home/mill/hosting/cloudflared.log
```

### Check Docker Container
```bash
ssh mill@192.168.68.117
docker ps
docker logs nextjs-app
```

---

## 📁 Important File Locations

### Local Machine
- **This repo**: `/Users/suparit/Desktop/code/cc-financial`
- **Hosting repo**: `/Users/suparit/Desktop/code/hosting`
- **Environment**: `deployment/.env` (synced from hosting/.env)
- **Deploy script**: `deployment/deploy-remote.sh`

### Remote Server (192.168.68.117)
- **Hosting dir**: `/home/mill/hosting`
- **Cloudflare config**: `/home/mill/hosting/cloudflare/config.yml`
- **Tunnel logs**: `/home/mill/hosting/cloudflared.log`
- **Systemd service**: `/etc/systemd/system/cloudflared.service`
- **Docker app**: Container `nextjs-app` on port 8358

---

## 🌐 Your Domains

- **Main Site**: https://millenniumist.dpdns.org
- **WWW**: https://www.millenniumist.dpdns.org
- **SSH Access**: ssh.millenniumist.dpdns.org (via Cloudflare Tunnel)
- **Sitemap**: https://millenniumist.dpdns.org/sitemap.xml

---

## 🎯 Next Steps: Get on Google

### 1. Verify with Google Search Console
   - Visit: https://search.google.com/search-console
   - Add property: `millenniumist.dpdns.org`
   - Choose verification method (HTML tag or file)

### 2. Submit Sitemap
   - In Search Console, submit: `https://millenniumist.dpdns.org/sitemap.xml`

### 3. Wait for Indexing
   - Typically takes 1-2 weeks
   - Monitor in Search Console

---

## 🆘 Quick Troubleshooting

### Site is down (Error 1033)
```bash
# Check if remote server is reachable
ping 192.168.68.117

# If reachable, restart tunnel
ssh mill@192.168.68.117
sudo systemctl restart cloudflared
```

### After server reboot
✅ **Nothing to do!** Tunnel auto-starts via systemd

### Deploy new code
```bash
cd /Users/suparit/Desktop/code/cc-financial
./deployment/deploy-remote.sh
```

### View all logs
```bash
ssh mill@192.168.68.117

# Tunnel logs
tail -f /home/mill/hosting/cloudflared.log

# Docker logs
docker logs -f nextjs-app

# System logs for tunnel service
sudo journalctl -u cloudflared -f
```

---

## ⚙️ Systemd Service Commands

```bash
# All commands run on remote server (ssh mill@192.168.68.117)

sudo systemctl status cloudflared    # Check status
sudo systemctl start cloudflared     # Start tunnel
sudo systemctl stop cloudflared      # Stop tunnel
sudo systemctl restart cloudflared   # Restart tunnel
sudo systemctl enable cloudflared    # Enable auto-start
sudo systemctl disable cloudflared   # Disable auto-start
sudo systemctl is-enabled cloudflared # Check if auto-start enabled
```

---

## 📊 What Was Fixed

### Before
- ❌ Cloudflare Tunnel was down
- ❌ Website showed Error 1033
- ❌ No auto-start (tunnel stopped after reboot)
- ❌ Manual process (nohup)

### After
- ✅ Tunnel is running
- ✅ Website is accessible
- ✅ Auto-start enabled via systemd
- ✅ Automatic restart if crash
- ✅ Proper logging
- ✅ Easy management with systemctl

---

## 📝 Files Changed in This Session

1. ✅ **deployment/.env** - Synced from hosting repo
2. ✅ **deployment/deploy-remote.sh** - Added systemd auto-start setup
3. ✅ **Remote: /etc/systemd/system/cloudflared.service** - Created service file
4. ✅ **TUNNEL_AUTO_START_SETUP.md** - Complete documentation
5. ✅ **QUICK_REFERENCE.md** - This file

---

**Everything is set up and working! Your site will stay online even after server reboots.** 🎉
