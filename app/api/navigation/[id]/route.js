import { NextResponse } from 'next/server';
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

export async function GET(request, { params }) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const item = await prisma.navigationItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { error: 'Navigation item not found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        item: {
          id: item.id,
          href: item.href,
          order: item.order,
          active: item.active,
          label: (item.label && (item.label[locale] ?? item.label.th ?? item.label.en)) || item.href,
          translations: item.label,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Failed to load navigation item', error);
    return NextResponse.json(
      { error: 'Unable to load navigation item' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export async function PUT(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const locale = body.locale || 'th';

  const updates = {};

  if ('label' in body || 'labelText' in body) {
    updates.label = ensureLocalized(body.label, locale) ?? ensureLocalized(body.labelText, locale);
  }
  if ('href' in body) {
    updates.href = body.href;
  }
  if ('order' in body) {
    updates.order = typeof body.order === 'number' ? body.order : 0;
  }
  if ('active' in body) {
    updates.active = Boolean(body.active);
  }

  try {
    const item = await prisma.navigationItem.update({ where: { id }, data: updates });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to update navigation item', error);
    return NextResponse.json({ error: 'Unable to update navigation item' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

export async function DELETE(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.navigationItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete navigation item', error);
    return NextResponse.json({ error: 'Unable to delete navigation item' }, { status: 500 });
  }
}
