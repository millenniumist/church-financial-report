import { PrismaClient } from '@prisma/client';
import { getPrismaClient, getDatabaseStatus, dbManager } from './db-connection-manager.js';

const globalForPrisma = globalThis;
const useHotSwap = process.env.NODE_ENV === 'production' && !!process.env.DATABASE_URL_SECONDARY;
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

if (useHotSwap) {
  console.log('[Prisma] Database hot-swap enabled - using connection manager');
}

if (isBuildTime) {
  console.log('[Prisma] Build time detected - database connections will be skipped');
}

let initPromise = null;

async function initializePrisma() {
  // Skip database initialization during build
  if (isBuildTime) {
    return null;
  }

  if (useHotSwap) {
    return await getPrismaClient();
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}

function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializePrisma().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function getClientSync() {
  // Return mock client during build to prevent errors
  if (isBuildTime) {
    return new Proxy({}, {
      get() {
        throw new Error('Database access not available during build time');
      }
    });
  }

  if (useHotSwap) {
    return dbManager.getCurrentClient();
  }

  if (!globalForPrisma.prisma) {
    throw new Error(
      'Prisma client not initialized yet. ' +
      'In API routes, ensure you await getPrisma() before using the client.'
    );
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({}, {
  get(_, prop) {
    const client = getClientSync();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export async function getPrisma() {
  await ensureInitialized();
  return getClientSync();
}

export { getDatabaseStatus };

// Only initialize at startup if not during build
if (!isBuildTime) {
  ensureInitialized().catch(err => {
    console.error('[Prisma] Failed to initialize:', err);
  });
}
