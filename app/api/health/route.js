import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

async function getHandler(request) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logError(request, error, {
      health_status: 'unhealthy',
      db_status: 'disconnected'
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      },
      { status: 503 }
    );
  }
}

export const GET = withLogging(getHandler);
