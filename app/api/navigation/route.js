import { NextResponse } from 'next/server';
import { getNavigationItems } from '@/lib/navigation';
import { prisma } from '@/lib/prisma';

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

function ensureLocalized(value, locale = 'th') {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return { [locale]: value };
  }
  if (typeof value === 'object') {
    return value;
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const items = await getNavigationItems({ locale });
    return NextResponse.json(
      { items },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to fetch navigation items', error);
    return NextResponse.json(
      { error: 'Unable to load navigation items' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export async function POST(request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const locale = body.locale || 'th';

  if (!body.href) {
    return NextResponse.json({ error: 'Navigation href is required' }, { status: 400 });
  }

  try {
    const item = await prisma.navigationItem.create({
      data: {
        href: body.href,
        order: typeof body.order === 'number' ? body.order : 0,
        active: body.active !== undefined ? Boolean(body.active) : true,
        label: ensureLocalized(body.label, locale) ?? ensureLocalized(body.labelText, locale) ?? {
          [locale]: body.href,
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Failed to create navigation item', error);
    return NextResponse.json({ error: 'Unable to create navigation item' }, { status: 500 });
  }
}
