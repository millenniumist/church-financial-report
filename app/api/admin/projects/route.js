import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

// GET all projects
async function getHandler() {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.futureProject.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ projects });
  } catch (error) {
    logError(request, error, { operation: 'admin_fetch_projects' });
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// CREATE new project
async function postHandler(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const project = await prisma.futureProject.create({
      data: {
        name: data.name,
        description: data.description || null,
        targetAmount: parseFloat(data.targetAmount) || 0,
        currentAmount: parseFloat(data.currentAmount) || 0,
        priority: parseInt(data.priority) || 0,
        isActive: data.isActive !== false,
        images: data.images || []
      }
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    logError(request, error, { operation: 'admin_create_project' });
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
export const POST = withLogging(postHandler);
