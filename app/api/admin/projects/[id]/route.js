import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

// GET single project
async function getHandler(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.futureProject.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    logError(request, error, { operation: 'admin_get_project', project_id: params?.id });
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// UPDATE project
async function patchHandler(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetAmount !== undefined) updateData.targetAmount = parseFloat(data.targetAmount);
    if (data.currentAmount !== undefined) updateData.currentAmount = parseFloat(data.currentAmount);
    if (data.priority !== undefined) updateData.priority = parseInt(data.priority);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.images !== undefined) updateData.images = data.images;

    const project = await prisma.futureProject.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    logError(request, error, { operation: 'admin_update_project', project_id: params?.id });
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE project
async function deleteHandler(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.futureProject.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(request, error, { operation: 'admin_delete_project', project_id: params?.id });
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
export const PATCH = withLogging(patchHandler);
export const DELETE = withLogging(deleteHandler);
