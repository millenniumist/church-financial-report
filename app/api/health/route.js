import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import pino from 'pino';

const logger = pino({
  level: 'info',
  base: { app_name: 'cc-church-api', app_version: '1.0', environment: process.env.NODE_ENV || 'production' },
});

export async function GET(request) {
  const startTime = Date.now();

  // Use ECS-safe field names (avoid conflicts with service, url, method)
  logger.info({
    http_method: 'GET',
    request_url: request.url,
    api_path: '/api/health',
    event_type: 'health-check'
  }, 'Health check started');

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    logger.info({
      health_status: 'healthy',
      duration_ms: duration,
      db_status: 'connected',
      event_type: 'health-check-response'
    }, 'Health check completed');

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      health_status: 'unhealthy',
      duration_ms: duration,
      db_status: 'disconnected',
      error_message: error.message,
      error_stack: error.stack,
      event_type: 'health-check-error'
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
