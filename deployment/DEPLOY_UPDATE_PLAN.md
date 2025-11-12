# Deploy-Remote.sh Update Plan

## After Tailscale is Verified Working

### Changes Needed:

#### 1. Add Tailscale Setup to .env
```bash
# Tailscale Configuration (for remote MQTT access)
ENABLE_TAILSCALE = true
TAILSCALE_AUTH_KEY = ""  # Optional: Pre-auth key for unattended setup
```

#### 2. Add Tailscale Installation Step to deploy-remote.sh

After health monitor setup (Step 10), add Step 11:

```bash
# Step 11: Setup Tailscale for remote access (optional)
if [ "${ENABLE_TAILSCALE:-false}" = "true" ]; then
  echo -e "${YELLOW}[11/11] Setting up Tailscale for remote MQTT access...${NC}"

  # Check if Tailscale is installed
  if ! ssh_cmd "command -v tailscale" >/dev/null 2>&1; then
    info "Installing Tailscale..."
    ssh_cmd "curl -fsSL https://tailscale.com/install.sh | sh" || warn "⚠️  Failed to install Tailscale"
  fi

  # Check if already authenticated
  if ! ssh_cmd "sudo tailscale status" >/dev/null 2>&1; then
    if [ -n "${TAILSCALE_AUTH_KEY:-}" ]; then
      info "Authenticating with pre-auth key..."
      ssh_cmd "sudo tailscale up --auth-key=${TAILSCALE_AUTH_KEY}"
    else
      warn "⚠️  Tailscale installed but not authenticated"
      warn "    Run: ssh $username@$hostIp 'sudo tailscale up'"
      warn "    Or set TAILSCALE_AUTH_KEY in .env for automatic setup"
    fi
  fi

  # Get Tailscale IP
  TAILSCALE_IP=$(ssh_cmd "sudo tailscale ip -4 2>/dev/null" || echo "")

  if [ -n "$TAILSCALE_IP" ]; then
    success "✓ Tailscale connected: $TAILSCALE_IP"
  else
    info "⚠️  Tailscale not yet authenticated. See TAILSCALE_SETUP.md"
  fi
  echo ""
fi
```

#### 3. Update Final Output

Add Tailscale info to the final output:

```bash
if [ "${ENABLE_TAILSCALE:-false}" = "true" ] && [ -n "${TAILSCALE_IP:-}" ]; then
  echo "Remote Access (Tailscale):"
  echo "  Install Tailscale app on your devices"
  echo "  Pi Tailscale IP: $TAILSCALE_IP"
  echo "  MQTT (remote): mqtt://$TAILSCALE_IP:1883"
  echo ""
fi
```

#### 4. Update .env.example

Add Tailscale section:

```bash
# Tailscale Configuration (optional)
# Enable to install and setup Tailscale for remote MQTT access
ENABLE_TAILSCALE = false

# Optional: Tailscale Pre-Auth Key
# Get from: https://login.tailscale.com/admin/settings/keys
# Leave empty for manual authentication via URL
TAILSCALE_AUTH_KEY = ""
```

#### 5. Update Documentation

- Update README.md with Tailscale integration
- Update DEPLOYMENT_SUMMARY.md
- Add note about pre-auth keys

### Testing Checklist

Once Tailscale is authenticated:

- [ ] Get Tailscale IP: `tailscale ip -4`
- [ ] Test MQTT locally: `mosquitto_pub -h 192.168.68.117 -t test -m hello`
- [ ] Test MQTT via Tailscale: `mosquitto_pub -h 100.x.x.x -t test -m hello`
- [ ] Verify from Android app
- [ ] Update deploy-remote.sh
- [ ] Test deployment script
- [ ] Commit and push

### Pre-Auth Key Setup (Optional)

For fully automated deployments without manual authentication:

1. Go to: https://login.tailscale.com/admin/settings/keys
2. Create auth key with:
   - Description: "CC Church Pi"
   - Reusable: Yes
   - Ephemeral: No
   - Tags: Add appropriate tags
3. Copy key to .env:
   ```
   TAILSCALE_AUTH_KEY=tskey-auth-xxxxxxxxxx
   ```
4. Next deployment will auto-authenticate!

### Benefits After Update

- ✅ One-command deployment includes Tailscale
- ✅ Optional: Can disable if not needed
- ✅ Auto-authentication with pre-auth key
- ✅ Shows Tailscale IP in deployment output
- ✅ Complete remote MQTT access setup

---

**Status**: Ready to implement once Tailscale is verified working

**Action**: Please authenticate at https://login.tailscale.com/a/a1a8763016235
