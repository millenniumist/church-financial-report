import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function getPrisma() {
  return prisma;
}

export function getDatabaseStatus() {
  return {
    currentDatabase: 'primary',
    failureCount: 0,
    lastFailoverTime: null,
    isHealthy: true,
    secondaryAvailable: false,
  };
}
