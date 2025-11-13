import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

async function getHandler(request) {
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
      isActive: project.isActive,
      images: Array.isArray(project.images) ? project.images : []
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      total: formattedProjects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError(request, error, { operation: 'fetch_projects' });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const GET = withLogging(getHandler);
