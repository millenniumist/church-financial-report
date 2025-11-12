#!/usr/bin/env node

/**
 * Health Monitor Service with MQTT Publishing
 *
 * Monitors the Next.js app and publishes health metrics to MQTT broker
 * - Container status
 * - HTTP response time
 * - Database connectivity
 * - System metrics (memory, CPU)
 */

const mqtt = require('mqtt');
const { exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');

const execAsync = promisify(exec);

// Configuration from environment variables
const CONFIG = {
  appUrl: process.env.APP_URL || 'http://localhost:8358',
  containerName: process.env.CONTAINER_NAME || 'nextjs-app',
  mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  mqttTopic: process.env.MQTT_TOPIC || 'homeassistant/sensor/cc-church',
  mqttClientId: process.env.MQTT_CLIENT_ID || 'cc-church-health',
  mqttUsername: process.env.MQTT_USERNAME || '',
  mqttPassword: process.env.MQTT_PASSWORD || '',
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60000'), // 60 seconds
  healthEndpoint: process.env.HEALTH_ENDPOINT || '/api/health',
};

// MQTT Client
let mqttClient = null;
let healthCheckInterval = null;

/**
 * Connect to MQTT broker
 */
function connectMqtt() {
  console.log('🔌 Connecting to MQTT broker:', CONFIG.mqttBroker);

  const options = {
    clientId: CONFIG.mqttClientId,
    clean: true,
    reconnectPeriod: 5000,
  };

  if (CONFIG.mqttUsername) {
    options.username = CONFIG.mqttUsername;
    options.password = CONFIG.mqttPassword;
  }

  mqttClient = mqtt.connect(CONFIG.mqttBroker, options);

  mqttClient.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
    startHealthChecks();
  });

  mqttClient.on('error', (error) => {
    console.error('✗ MQTT connection error:', error.message);
  });

  mqttClient.on('close', () => {
    console.log('⚠️  MQTT connection closed');
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconnecting to MQTT broker...');
  });
}

/**
 * Check if Docker container is running
 */
async function checkContainerStatus() {
  try {
    const { stdout } = await execAsync(`docker ps --filter name=${CONFIG.containerName} --format "{{.Status}}"`);
    const status = stdout.trim();

    if (status) {
      return {
        running: true,
        status: status,
        uptime: extractUptime(status)
      };
    }

    return { running: false, status: 'stopped', uptime: 0 };
  } catch (error) {
    return { running: false, status: 'error', uptime: 0, error: error.message };
  }
}

/**
 * Extract uptime in seconds from Docker status string
 */
function extractUptime(statusString) {
  const match = statusString.match(/Up (\d+) (second|minute|hour|day)/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400
  };

  return value * (multipliers[unit] || 0);
}

/**
 * Check HTTP response time
 */
async function checkHttpHealth() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const url = new URL(CONFIG.healthEndpoint, CONFIG.appUrl);

    const timeout = setTimeout(() => {
      resolve({
        available: false,
        responseTime: -1,
        error: 'timeout'
      });
    }, 5000);

    http.get(url.toString(), (res) => {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          available: res.statusCode === 200,
          responseTime,
          statusCode: res.statusCode
        });
      });
    }).on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        available: false,
        responseTime: -1,
        error: error.message
      });
    });
  });
}

/**
 * Get container memory usage
 */
async function getContainerStats() {
  try {
    const { stdout } = await execAsync(
      `docker stats ${CONFIG.containerName} --no-stream --format "{{.MemUsage}}|{{.CPUPerc}}"`
    );

    const [memUsage, cpuPerc] = stdout.trim().split('|');
    const memMatch = memUsage.match(/([\d.]+)([KMG]iB)/);

    let memoryMB = 0;
    if (memMatch) {
      const value = parseFloat(memMatch[1]);
      const unit = memMatch[2];
      const multipliers = { 'KiB': 0.001, 'MiB': 1, 'GiB': 1024 };
      memoryMB = value * (multipliers[unit] || 1);
    }

    return {
      memoryMB: Math.round(memoryMB),
      cpuPercent: parseFloat(cpuPerc) || 0
    };
  } catch (error) {
    return { memoryMB: 0, cpuPercent: 0, error: error.message };
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck() {
  console.log('🔍 Performing health check...');

  const [containerStatus, httpHealth, containerStats] = await Promise.all([
    checkContainerStatus(),
    checkHttpHealth(),
    getContainerStats()
  ]);

  const health = {
    timestamp: new Date().toISOString(),
    container: containerStatus,
    http: httpHealth,
    stats: containerStats,
    overall: containerStatus.running && httpHealth.available ? 'healthy' : 'unhealthy'
  };

  console.log(`  Status: ${health.overall.toUpperCase()}`);
  console.log(`  Container: ${containerStatus.running ? 'running' : 'stopped'}`);
  console.log(`  HTTP: ${httpHealth.available ? `${httpHealth.responseTime}ms` : 'unavailable'}`);
  console.log(`  Memory: ${containerStats.memoryMB}MB`);
  console.log(`  CPU: ${containerStats.cpuPercent.toFixed(1)}%`);

  return health;
}

/**
 * Publish health data to MQTT
 */
function publishToMqtt(health) {
  if (!mqttClient || !mqttClient.connected) {
    console.warn('⚠️  MQTT client not connected, skipping publish');
    return;
  }

  // Publish main health status
  const payload = JSON.stringify(health, null, 2);
  mqttClient.publish(`${CONFIG.mqttTopic}/state`, payload, { qos: 1, retain: true });

  // Publish individual metrics for easier Home Assistant integration
  mqttClient.publish(`${CONFIG.mqttTopic}/status`, health.overall, { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/container_running`, String(health.container.running), { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/http_available`, String(health.http.available), { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/response_time`, String(health.http.responseTime), { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/memory_mb`, String(health.stats.memoryMB), { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/cpu_percent`, String(health.stats.cpuPercent.toFixed(1)), { qos: 1, retain: true });
  mqttClient.publish(`${CONFIG.mqttTopic}/uptime`, String(health.container.uptime), { qos: 1, retain: true });

  console.log('✓ Published to MQTT');
}

/**
 * Publish Home Assistant MQTT Discovery config
 */
function publishHomeAssistantDiscovery() {
  if (!mqttClient || !mqttClient.connected) return;

  console.log('📡 Publishing Home Assistant discovery configs...');

  const sensors = [
    {
      name: 'CC Church Status',
      unique_id: 'cc_church_status',
      state_topic: `${CONFIG.mqttTopic}/status`,
      icon: 'mdi:church',
      value_template: '{{ value }}'
    },
    {
      name: 'CC Church Response Time',
      unique_id: 'cc_church_response_time',
      state_topic: `${CONFIG.mqttTopic}/response_time`,
      unit_of_measurement: 'ms',
      icon: 'mdi:timer',
      value_template: '{{ value }}'
    },
    {
      name: 'CC Church Memory Usage',
      unique_id: 'cc_church_memory',
      state_topic: `${CONFIG.mqttTopic}/memory_mb`,
      unit_of_measurement: 'MB',
      icon: 'mdi:memory',
      value_template: '{{ value }}'
    },
    {
      name: 'CC Church CPU Usage',
      unique_id: 'cc_church_cpu',
      state_topic: `${CONFIG.mqttTopic}/cpu_percent`,
      unit_of_measurement: '%',
      icon: 'mdi:cpu-64-bit',
      value_template: '{{ value }}'
    },
    {
      name: 'CC Church Uptime',
      unique_id: 'cc_church_uptime',
      state_topic: `${CONFIG.mqttTopic}/uptime`,
      unit_of_measurement: 's',
      icon: 'mdi:clock',
      value_template: '{{ value }}'
    }
  ];

  sensors.forEach(sensor => {
    const config = {
      ...sensor,
      device: {
        identifiers: ['cc_church_app'],
        name: 'CC Church Application',
        manufacturer: 'Custom',
        model: 'Next.js on Raspberry Pi'
      }
    };

    const topic = `homeassistant/sensor/cc_church_${sensor.unique_id}/config`;
    mqttClient.publish(topic, JSON.stringify(config), { qos: 1, retain: true });
  });

  console.log('✓ Home Assistant discovery published');
}

/**
 * Start periodic health checks
 */
function startHealthChecks() {
  console.log(`⏱️  Starting health checks every ${CONFIG.checkInterval / 1000}s`);

  // Publish Home Assistant discovery on startup
  publishHomeAssistantDiscovery();

  // Initial check
  performHealthCheck().then(publishToMqtt);

  // Periodic checks
  healthCheckInterval = setInterval(async () => {
    const health = await performHealthCheck();
    publishToMqtt(health);
  }, CONFIG.checkInterval);
}

/**
 * Cleanup on exit
 */
function cleanup() {
  console.log('\n🛑 Shutting down health monitor...');

  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  if (mqttClient) {
    mqttClient.end();
  }

  process.exit(0);
}

// Handle signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the service
console.log('🏥 CC Church Health Monitor');
console.log('============================');
console.log('Configuration:');
console.log(`  App URL: ${CONFIG.appUrl}`);
console.log(`  Container: ${CONFIG.containerName}`);
console.log(`  MQTT Broker: ${CONFIG.mqttBroker}`);
console.log(`  MQTT Topic: ${CONFIG.mqttTopic}`);
console.log(`  Check Interval: ${CONFIG.checkInterval / 1000}s`);
console.log('============================\n');

connectMqtt();
