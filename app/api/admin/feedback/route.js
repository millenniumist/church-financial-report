import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

async function getHandler(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logError(request, error, { operation: 'admin_fetch_feedback' });
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
