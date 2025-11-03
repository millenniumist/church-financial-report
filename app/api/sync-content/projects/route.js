import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_projects_${Date.now()}`;

  logger.info({ requestId }, 'Future projects sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projects } = body;

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'projects array is required' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const project of projects) {
      const { id, name, description, targetAmount, currentAmount, priority, isActive } = project;

      if (!name) {
        logger.warn({ project }, 'Project missing name, skipping');
        skipped++;
        continue;
      }

      // If ID is provided, try to update by ID, otherwise use name to find existing
      let existing = null;
      if (id) {
        existing = await prisma.futureProject.findUnique({
          where: { id }
        });
      } else {
        // Try to find by name if no ID provided
        existing = await prisma.futureProject.findFirst({
          where: { name }
        });
      }

      const data = {
        name,
        description: description || null,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : 0,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : 0,
        priority: priority !== undefined ? Number(priority) : 0,
        isActive: isActive !== undefined ? isActive : true
      };

      if (existing) {
        await prisma.futureProject.update({
          where: { id: existing.id },
          data
        });
        updated++;
      } else {
        await prisma.futureProject.create({ data });
        created++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      created,
      updated,
      skipped
    }, 'Future projects sync completed');

    return NextResponse.json({
      success: true,
      message: `Synced ${projects.length} future projects`,
      created,
      updated,
      skipped,
      total: projects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ requestId, duration: `${duration}ms`, error: error.message }, 'Future projects sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync future projects',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
