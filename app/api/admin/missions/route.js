import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

// GET all missions
async function getHandler() {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const missions = await prisma.mission.findMany({
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json({ missions });
  } catch (error) {
    logError(request, error, { operation: 'admin_fetch_missions' });
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
      { status: 500 }
    );
  }
}

// CREATE new mission
async function postHandler(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const mission = await prisma.mission.create({
      data: {
        slug: data.slug,
        title: data.title,
        theme: data.theme,
        summary: data.summary,
        description: data.description,
        focusAreas: data.focusAreas,
        scripture: data.scripture || null,
        nextSteps: data.nextSteps,
        pinned: data.pinned || false,
        heroImageUrl: data.heroImageUrl || null,
        images: data.images || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    });

    return NextResponse.json({ success: true, mission }, { status: 201 });
  } catch (error) {
    logError(request, error, { operation: 'admin_create_mission' });
    return NextResponse.json(
      { error: 'Failed to create mission', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
export const POST = withLogging(postHandler);
