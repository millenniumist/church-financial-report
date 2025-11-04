import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request) {
  const startTime = Date.now();
  const requestId = `projects_${Date.now()}`;

  logger.info({ requestId, method: 'GET', endpoint: '/api/projects' }, 'Projects fetch started');

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Fetch projects from database
    const projects = await prisma.futureProject.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'asc' }  // Then by creation date
      ]
    });

    // Transform to match the expected format for the frontend
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      goal: project.targetAmount,
      current: project.currentAmount,
      percentage: project.targetAmount > 0
        ? Math.round((project.currentAmount / project.targetAmount) * 100)
        : 0,
      priority: project.priority,
      isActive: project.isActive
    }));

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      projectCount: formattedProjects.length,
      activeOnly
    }, 'Projects fetch completed');

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total: formattedProjects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      requestId,
      duration: `${duration}ms`,
      error: { message: error.message, stack: error.stack }
    }, 'Projects fetch failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
