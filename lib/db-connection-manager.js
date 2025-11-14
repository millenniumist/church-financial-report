import { PrismaClient } from '@prisma/client';

/**
 * Database Connection Manager with Hot-Swap Failover
 *
 * Automatically switches between primary and secondary databases
 * when connection issues are detected.
 *
 * Features:
 * - Automatic failover to secondary database
 * - Health checks and automatic failback to primary
 * - Connection retry logic
 * - Circuit breaker pattern
 */

const CONFIG = {
  PRIMARY_URL: process.env.DATABASE_URL,
  SECONDARY_URL: process.env.DATABASE_URL_SECONDARY,

  // Health check interval (30 seconds)
  HEALTH_CHECK_INTERVAL: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'),

  // Connection timeout (5 seconds)
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),

  // Number of failures before switching to secondary
  FAILURE_THRESHOLD: parseInt(process.env.DB_FAILURE_THRESHOLD || '3'),

  // Retry interval for primary when on secondary (2 minutes)
  PRIMARY_RETRY_INTERVAL: parseInt(process.env.DB_PRIMARY_RETRY_INTERVAL || '120000'),
};

class DatabaseConnectionManager {
  constructor() {
    this.primaryClient = null;
    this.secondaryClient = null;
    this.currentClient = null;
    this.currentDatabase = 'none';
    this.failureCount = 0;
    this.isHealthChecking = false;
    this.healthCheckTimer = null;
    this.lastFailoverTime = null;
    this.isInitialized = false;

    // Bind methods
    this.getClient = this.getClient.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  /**
   * Initialize the connection manager
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Log configuration (without passwords)
    console.log('[DB Manager] Initializing with configuration:');
    console.log(`  Primary: ${this.maskConnectionString(CONFIG.PRIMARY_URL)}`);
    console.log(`  Secondary: ${CONFIG.SECONDARY_URL ? this.maskConnectionString(CONFIG.SECONDARY_URL) : 'Not configured'}`);
    console.log(`  Health check interval: ${CONFIG.HEALTH_CHECK_INTERVAL}ms`);
    console.log(`  Failure threshold: ${CONFIG.FAILURE_THRESHOLD}`);

    // Try to connect to primary first
    await this.connectToPrimary();

    // Start health check loop
    this.startHealthCheck();

    this.isInitialized = true;
  }

  /**
   * Mask connection string for logging
   */
  maskConnectionString(url) {
    if (!url) return 'Not configured';
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
    } catch {
      return 'Invalid URL';
    }
  }

  /**
   * Connect to primary database
   */
  async connectToPrimary() {
    if (!CONFIG.PRIMARY_URL) {
      console.error('[DB Manager] ❌ No primary database URL configured');
      await this.connectToSecondary();
      return;
    }

    try {
      console.log('[DB Manager] Attempting to connect to primary database...');

      if (!this.primaryClient) {
        this.primaryClient = new PrismaClient({
          datasources: {
            db: { url: CONFIG.PRIMARY_URL }
          },
          log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        });
      }

      // Test connection with timeout
      const connectionPromise = this.primaryClient.$queryRaw`SELECT 1 as connected`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), CONFIG.CONNECTION_TIMEOUT)
      );

      await Promise.race([connectionPromise, timeoutPromise]);

      // Success!
      this.currentClient = this.primaryClient;
      this.currentDatabase = 'primary';
      this.failureCount = 0;

      if (this.lastFailoverTime) {
        const downtime = Math.round((Date.now() - this.lastFailoverTime) / 1000);
        console.log(`[DB Manager] ✅ Primary database reconnected (was down for ${downtime}s)`);
        this.lastFailoverTime = null;
      } else {
        console.log('[DB Manager] ✅ Connected to primary database');
      }

    } catch (error) {
      console.error(`[DB Manager] ❌ Failed to connect to primary database:`, error.message);
      this.failureCount++;

      if (this.failureCount >= CONFIG.FAILURE_THRESHOLD) {
        console.log(`[DB Manager] ⚠️  Failure threshold reached (${this.failureCount}/${CONFIG.FAILURE_THRESHOLD}), failing over to secondary`);
        await this.connectToSecondary();
      } else {
        throw error;
      }
    }
  }

  /**
   * Connect to secondary database
   */
  async connectToSecondary() {
    if (!CONFIG.SECONDARY_URL) {
      console.error('[DB Manager] ❌ No secondary database URL configured');
      throw new Error('Both primary and secondary databases are unavailable');
    }

    try {
      console.log('[DB Manager] Attempting to connect to secondary database...');

      if (!this.secondaryClient) {
        this.secondaryClient = new PrismaClient({
          datasources: {
            db: { url: CONFIG.SECONDARY_URL }
          },
          log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        });
      }

      // Test connection
      await this.secondaryClient.$queryRaw`SELECT 1 as connected`;

      // Success!
      this.currentClient = this.secondaryClient;
      this.currentDatabase = 'secondary';
      this.lastFailoverTime = Date.now();

      console.log('[DB Manager] ✅ Connected to secondary database (FAILOVER MODE)');

    } catch (error) {
      console.error(`[DB Manager] ❌ Failed to connect to secondary database:`, error.message);
      throw new Error('Both primary and secondary databases are unavailable');
    }
  }

  /**
   * Start health check loop
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.healthCheck();
    }, CONFIG.HEALTH_CHECK_INTERVAL);

    // Ensure cleanup on process exit
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', () => this.cleanup());
      process.on('SIGINT', () => this.cleanup());
    }
  }

  /**
   * Perform health check and handle failover/failback
   */
  async healthCheck() {
    if (this.isHealthChecking) {
      return; // Skip if already checking
    }

    this.isHealthChecking = true;

    try {
      // If on secondary, try to reconnect to primary
      if (this.currentDatabase === 'secondary') {
        const downtime = this.lastFailoverTime
          ? Math.round((Date.now() - this.lastFailoverTime) / 1000)
          : 0;

        // Only retry primary after minimum interval
        if (downtime >= CONFIG.PRIMARY_RETRY_INTERVAL / 1000) {
          console.log('[DB Manager] 🔄 Attempting to reconnect to primary database...');
          try {
            await this.connectToPrimary();
          } catch (error) {
            // Stay on secondary
            console.log('[DB Manager] ⚠️  Primary still unavailable, staying on secondary');
          }
        }
      }
      // If on primary, verify connection is still healthy
      else if (this.currentDatabase === 'primary') {
        try {
          await Promise.race([
            this.currentClient.$queryRaw`SELECT 1 as connected`,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Health check timeout')), CONFIG.CONNECTION_TIMEOUT)
            )
          ]);

          // Reset failure count on successful health check
          this.failureCount = 0;
        } catch (error) {
          console.error('[DB Manager] ❌ Primary database health check failed:', error.message);
          this.failureCount++;

          if (this.failureCount >= CONFIG.FAILURE_THRESHOLD) {
            console.log('[DB Manager] ⚠️  Primary unhealthy, failing over to secondary...');
            await this.connectToSecondary();
          }
        }
      }
    } finally {
      this.isHealthChecking = false;
    }
  }

  /**
   * Get the current active database client
   */
  async getClient() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.currentClient) {
      throw new Error('No database connection available');
    }

    return this.currentClient;
  }

  /**
   * Get current database status
   */
  getStatus() {
    return {
      currentDatabase: this.currentDatabase,
      failureCount: this.failureCount,
      lastFailoverTime: this.lastFailoverTime,
      isHealthy: this.currentDatabase !== 'none',
      secondaryAvailable: !!CONFIG.SECONDARY_URL,
    };
  }

  /**
   * Cleanup connections
   */
  async cleanup() {
    console.log('[DB Manager] Cleaning up database connections...');

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.primaryClient) {
      await this.primaryClient.$disconnect();
    }

    if (this.secondaryClient) {
      await this.secondaryClient.$disconnect();
    }

    this.isInitialized = false;
  }
}

// Singleton instance
const globalForDb = globalThis;
const dbManager = globalForDb.dbManager ?? new DatabaseConnectionManager();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbManager = dbManager;
}

/**
 * Get Prisma client with automatic failover
 */
export async function getPrismaClient() {
  return await dbManager.getClient();
}

/**
 * Get database connection status
 */
export function getDatabaseStatus() {
  return dbManager.getStatus();
}

/**
 * Export manager instance for advanced usage
 */
export { dbManager };
