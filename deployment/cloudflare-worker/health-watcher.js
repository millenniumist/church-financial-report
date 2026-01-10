/**
 * Cloudflare Worker: External Health Monitor
 *
 * Monitors the CC Financial Application from outside the Pi infrastructure.
 * Runs every minute via Cloudflare's edge network and sends Discord alerts
 * if the application becomes unreachable.
 *
 * Features:
 * - Checks health endpoint every 1 minute
 * - Sends Discord alerts on failures (with state tracking to avoid spam)
 * - Sends recovery notifications when service comes back
 * - Completely independent of Pi (runs on Cloudflare's global network)
 */

const PROD_APP_URL = 'https://www.chonburichurch.com/api/health';
const DEV_APP_URL = 'https://millenniumist.dpdns.org/api/health';

// Configuration (set via wrangler.toml or Cloudflare dashboard)
const CONFIG = {
  APP_URL: PROD_APP_URL,
  DISCORD_BOT_TOKEN: '', // Set as environment variable
  DISCORD_CHANNEL_ID: '', // Set as environment variable
  ALERT_COOLDOWN: 300000, // 5 minutes in milliseconds
  TIMEOUT: 15000, // 15 second timeout
};

/**
 * Send Discord notification via Bot API
 */
async function sendDiscordNotification(embed) {
  const url = `https://discord.com/api/v10/channels/${CONFIG.DISCORD_CHANNEL_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${CONFIG.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    console.error(`Discord API error: ${response.status}`, await response.text());
  }

  return response.ok;
}

/**
 * Check application health
 */
async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const startTime = Date.now();
    const response = await fetch(CONFIG.APP_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Cloudflare-Worker-Health-Monitor/1.0',
      },
    });
    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);

    return {
      available: response.ok,
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      available: false,
      error: error.message,
      responseTime: -1,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Main scheduled handler
 */
export default {
  async scheduled(event, env, ctx) {
    try {
      // Get configuration from environment variables
      CONFIG.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
      CONFIG.DISCORD_CHANNEL_ID = env.DISCORD_CHANNEL_ID;
      const envName = (env.ENVIRONMENT || env.NODE_ENV || '').toLowerCase();
      const defaultAppUrl =
        envName && envName !== 'production' ? DEV_APP_URL : PROD_APP_URL;
      CONFIG.APP_URL = env.APP_URL || defaultAppUrl;

      if (!CONFIG.DISCORD_BOT_TOKEN || !CONFIG.DISCORD_CHANNEL_ID) {
        console.error('Discord credentials not configured');
        return;
      }

      // Check health
      const health = await checkHealth();
      console.log('Health check:', JSON.stringify(health));

      // Get previous state from KV storage
      const lastStateJson = await env.HEALTH_STATE.get('lastState');
      const lastState = lastStateJson ? JSON.parse(lastStateJson) : null;
      const lastStatus = lastState?.status || 'unknown';
      const lastAlertTime = lastState?.lastAlertTime || 0;
      const now = Date.now();

      const currentStatus = health.available ? 'healthy' : 'unhealthy';
      const stateChanged = lastStatus !== currentStatus;
      const cooldownExpired = now - lastAlertTime > CONFIG.ALERT_COOLDOWN;

      // Send alert if site is down
      if (currentStatus === 'unhealthy' && (stateChanged || cooldownExpired)) {
        const embed = {
          title: '🚨 CC Church Application Down (External Monitor)',
          description: 'The application is unreachable from the internet',
          color: 15158332, // Red
          fields: [
            {
              name: 'Status',
              value: '```UNREACHABLE```',
              inline: true,
            },
            {
              name: 'URL',
              value: CONFIG.APP_URL,
              inline: false,
            },
            {
              name: 'Error',
              value: health.error || `HTTP ${health.statusCode}`,
              inline: true,
            },
            {
              name: 'Timestamp',
              value: new Date(health.timestamp).toLocaleString(),
              inline: true,
            },
          ],
          footer: {
            text: 'External Monitor (Cloudflare Worker)',
          },
          timestamp: health.timestamp,
        };

        const sent = await sendDiscordNotification(embed);
        if (sent) {
          console.log('Discord alert sent');
          // Update last alert time
          await env.HEALTH_STATE.put('lastState', JSON.stringify({
            status: currentStatus,
            lastAlertTime: now,
            timestamp: health.timestamp,
          }));
        }
      }
      // Send recovery notification
      else if (currentStatus === 'healthy' && lastStatus === 'unhealthy') {
        const embed = {
          title: '✅ CC Church Application Recovered',
          description: 'The application is now reachable again',
          color: 3066993, // Green
          fields: [
            {
              name: 'Status',
              value: '✅ Healthy',
              inline: true,
            },
            {
              name: 'Response Time',
              value: `${health.responseTime}ms`,
              inline: true,
            },
            {
              name: 'Timestamp',
              value: new Date(health.timestamp).toLocaleString(),
              inline: true,
            },
          ],
          footer: {
            text: 'External Monitor (Cloudflare Worker)',
          },
          timestamp: health.timestamp,
        };

        const sent = await sendDiscordNotification(embed);
        if (sent) {
          console.log('Discord recovery notification sent');
        }
      }

      // Always update state
      await env.HEALTH_STATE.put('lastState', JSON.stringify({
        status: currentStatus,
        lastAlertTime: currentStatus === 'unhealthy' ? now : lastAlertTime,
        timestamp: health.timestamp,
      }));

    } catch (error) {
      console.error('Health monitor error:', error);
    }
  },

  // Optional: HTTP endpoint for manual testing
  async fetch(request, env, ctx) {
    CONFIG.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
    CONFIG.DISCORD_CHANNEL_ID = env.DISCORD_CHANNEL_ID;

    const health = await checkHealth();

    return new Response(JSON.stringify({
      worker: 'CC Church External Health Monitor',
      health,
      lastState: await env.HEALTH_STATE.get('lastState'),
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
