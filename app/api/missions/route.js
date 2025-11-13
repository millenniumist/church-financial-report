import { NextResponse } from 'next/server';
import { getMissions, normalizeMission, DEFAULT_LOCALE } from '@/lib/missions';
import { prisma } from '@/lib/prisma';
import { withLogging, logError } from '@/lib/logger';

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

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '6', 10);
  const locale = searchParams.get('locale') || 'th';
  const highlightOnly = searchParams.get('highlightOnly') === 'true';

  try {
    const data = await getMissions({
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) ? 6 : pageSize,
      locale,
      highlightOnly,
    });

    return NextResponse.json(data, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { operation: 'fetch_missions' });
    return NextResponse.json(
      {
        error: 'Unable to fetch missions',
      },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);

async function postHandler(request) {
  if (!authorize(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
      }
    );
  }

  const body = await request.json();
  const locale = body.locale || DEFAULT_LOCALE;

  if (!body.slug) {
    return NextResponse.json(
      { error: 'Mission slug is required' },
      {
        status: 400,
      }
    );
  }

  try {
    const mission = await prisma.mission.create({
      data: {
        slug: body.slug,
        title: ensureLocalized(body.title, locale) ?? ensureLocalized(body.titleText, locale),
        theme: ensureLocalized(body.theme, locale) ?? {},
        summary: ensureLocalized(body.summary, locale) ?? {},
        description: ensureLocalized(body.description, locale) ?? {},
        focusAreas: ensureLocalizedList(body.focusAreas, locale),
        scripture: body.scripture ?? null,
        nextSteps: ensureLocalizedList(body.nextSteps, locale),
        pinned: Boolean(body.pinned),
        heroImageUrl: body.heroImageUrl ?? null,
        images: Array.isArray(body.images) ? body.images : [],
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(normalizeMission(mission, locale), {
      status: 201,
    });
  } catch (error) {
    logError(request, error, { operation: 'create_mission', slug: body.slug });
    return NextResponse.json(
      { error: 'Unable to create mission' },
      {
        status: 500,
      }
    );
  }
}

export const POST = withLogging(postHandler);
