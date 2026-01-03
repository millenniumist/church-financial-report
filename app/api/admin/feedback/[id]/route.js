import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

async function patchHandler(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['NEW', 'READ', 'ARCHIVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    logError(request, error, { operation: 'admin_update_feedback' });
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

export const PATCH = withLogging(patchHandler);
