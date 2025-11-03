import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request) {
  const startTime = Date.now();

  logger.info({
    method: 'GET',
    url: request.url,
    type: 'health-check'
  }, 'Health check started');

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;
    logger.info({
      status: 'healthy',
      duration: `${duration}ms`,
      database: 'connected'
    }, 'Health check completed');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      status: 'unhealthy',
      duration: `${duration}ms`,
      database: 'disconnected',
      error: {
        message: error.message,
        stack: error.stack
      }
    }, 'Health check failed');

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
