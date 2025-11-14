import { PrismaClient } from '@prisma/client';
import { getPrismaClient, getDatabaseStatus, dbManager } from './db-connection-manager.js';

const globalForPrisma = globalThis;

// Use hot-swap connection manager if secondary database is configured
const useHotSwap = !!process.env.DATABASE_URL_SECONDARY;

if (useHotSwap) {
  console.log('[Prisma] Database hot-swap enabled - using connection manager');
}

/**
 * Initialize and get Prisma client
 * - With hot-swap: Uses connection manager with automatic failover
 * - Without hot-swap: Uses standard Prisma client
 */
async function initializePrisma() {
  if (useHotSwap) {
    // Initialize connection manager
    const client = await getPrismaClient();
    return client;
  }

  // Standard client without hot-swap
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Create a lazy-initialized client that works synchronously
let clientPromise = null;
let clientInstance = null;

function getClientSync() {
  if (!clientPromise) {
    clientPromise = initializePrisma().then(client => {
      clientInstance = client;
      return client;
    });
  }

  if (clientInstance) {
    return clientInstance;
  }

  // If not initialized yet, throw error with helpful message
  throw new Error(
    'Prisma client not initialized yet. ' +
    'In API routes, ensure you await the database connection. ' +
    'Consider using the async initialization pattern.'
  );
}

// Export standard sync client (works after initialization)
export const prisma = new Proxy({}, {
  get(target, prop) {
    const client = getClientSync();
    return client[prop];
  }
});

// Export async initialization for API routes
export async function getPrisma() {
  if (!clientPromise) {
    clientPromise = initializePrisma();
  }
  return await clientPromise;
}

// Export database status function
export { getDatabaseStatus };

// Initialize immediately in production
if (typeof process !== 'undefined' && !process.env.__NEXT_PRIVATE_PREBUNDLED_REACT) {
  initializePrisma().catch(err => {
    console.error('[Prisma] Failed to initialize:', err);
  });
}

if (process.env.NODE_ENV !== 'production' && !useHotSwap) {
  globalForPrisma.prisma = prisma;
}
