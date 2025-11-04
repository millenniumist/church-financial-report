import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeMission, DEFAULT_LOCALE } from '@/lib/missions';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

function authorize(request) {
  const expectedKey = process.env.CONTENT_API_KEY ?? process.env.SYNC_API_KEY;
  if (!expectedKey) return true;

  const apiKey = request.headers.get('x-api-key');
  const bearer = request.headers.get('authorization');

  if (apiKey && apiKey === expectedKey) return true;
  if (bearer && bearer === `Bearer ${expectedKey}`) return true;

  return false;
}

function ensureLocalized(value, locale = DEFAULT_LOCALE) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return { [locale]: value };
  }
  if (typeof value === 'object') {
    return value;
  }
  return null;
}

function ensureLocalizedList(value, locale = DEFAULT_LOCALE) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return { [locale]: value };
  }
  if (typeof value === 'object') {
    return value;
  }
  return [];
}

export async function GET(request, { params }) {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;

  try {
    const mission = await prisma.mission.findUnique({ where: { slug } });
    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(normalizeMission(mission, locale), {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Failed to load mission', error);
    return NextResponse.json(
      { error: 'Unable to load mission' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export async function PUT(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { slug } = params;
  const body = await request.json();
  const locale = body.locale || DEFAULT_LOCALE;

  const updates = {};

  if ('title' in body || 'titleText' in body) {
    updates.title = ensureLocalized(body.title, locale) ?? ensureLocalized(body.titleText, locale);
  }
  if ('theme' in body) {
    updates.theme = ensureLocalized(body.theme, locale) ?? {};
  }
  if ('summary' in body) {
    updates.summary = ensureLocalized(body.summary, locale) ?? {};
  }
  if ('description' in body) {
    updates.description = ensureLocalized(body.description, locale) ?? {};
  }
  if ('focusAreas' in body) {
    updates.focusAreas = ensureLocalizedList(body.focusAreas, locale);
  }
  if ('scripture' in body) {
    updates.scripture = body.scripture ?? null;
  }
  if ('nextSteps' in body) {
    updates.nextSteps = ensureLocalizedList(body.nextSteps, locale);
  }
  if ('pinned' in body) {
    updates.pinned = Boolean(body.pinned);
  }
  if ('heroImageUrl' in body) {
    updates.heroImageUrl = body.heroImageUrl ?? null;
  }
  if ('images' in body) {
    updates.images = Array.isArray(body.images) ? body.images : [];
  }
  if ('startDate' in body) {
    updates.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if ('endDate' in body) {
    updates.endDate = body.endDate ? new Date(body.endDate) : null;
  }

  try {
    const mission = await prisma.mission.update({
      where: { slug },
      data: updates,
    });

    return NextResponse.json(normalizeMission(mission, locale));
  } catch (error) {
    console.error('Failed to update mission', error);
    return NextResponse.json(
      { error: 'Unable to update mission' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

export async function DELETE(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { slug } = params;

  try {
    await prisma.mission.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete mission', error);
    return NextResponse.json(
      { error: 'Unable to delete mission' },
      { status: 500 }
    );
  }
}
