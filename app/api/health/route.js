import { NextResponse } from 'next/server';
import { prisma, getDatabaseStatus } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

async function getHandler(request) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get database failover status if hot-swap is enabled
    const dbStatus = getDatabaseStatus();
    const useHotSwap = !!process.env.DATABASE_URL_SECONDARY;

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    };

    // Add hot-swap information if enabled
    if (useHotSwap) {
      response.hotSwap = {
        enabled: true,
        currentDatabase: dbStatus.currentDatabase,
        failoverAvailable: dbStatus.secondaryAvailable,
        failureCount: dbStatus.failureCount,
        ...(dbStatus.lastFailoverTime && {
          lastFailover: new Date(dbStatus.lastFailoverTime).toISOString(),
          uptimeSinceFailover: Math.round((Date.now() - dbStatus.lastFailoverTime) / 1000) + 's'
        })
      };
    } else {
      response.hotSwap = {
        enabled: false,
        message: 'Set DATABASE_URL_SECONDARY to enable automatic database failover'
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    logError(request, error, {
      health_status: 'unhealthy',
      db_status: 'disconnected'
    });

    const dbStatus = getDatabaseStatus();

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
        hotSwap: {
          enabled: !!process.env.DATABASE_URL_SECONDARY,
          currentDatabase: dbStatus.currentDatabase,
          failoverAvailable: dbStatus.secondaryAvailable
        }
      },
      { status: 503 }
    );
  }
}

export const GET = withLogging(getHandler);
