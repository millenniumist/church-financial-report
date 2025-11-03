import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPageSection, normalizeContent, DEFAULT_LOCALE } from '@/lib/page-content';

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

export async function GET(request, { params }) {
  const { page, section } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;

  try {
    const record = await getPageSection(page, section, locale);
    if (!record) {
      return NextResponse.json({ error: 'Page content not found' }, { status: 404, headers: CACHE_HEADERS });
    }

    return NextResponse.json({ section: record }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Failed to load page content section', error);
    return NextResponse.json({ error: 'Unable to load page content section' }, { status: 500, headers: CACHE_HEADERS });
  }
}

export async function PUT(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page, section } = params;
  const body = await request.json();
  const locale = body.locale || DEFAULT_LOCALE;

  const updates = {};

  if ('title' in body) updates.title = body.title;
  if ('subtitle' in body) updates.subtitle = body.subtitle;
  if ('description' in body) updates.description = body.description;
  if ('body' in body) updates.body = body.body;
  if ('metadata' in body) updates.metadata = body.metadata;

  try {
    const record = await prisma.pageContent.update({
      where: { page_section: { page, section } },
      data: updates,
    });

    return NextResponse.json({ section: normalizeContent(record, locale) });
  } catch (error) {
    console.error('Failed to update page content', error);
    return NextResponse.json({ error: 'Unable to update page content' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

export async function DELETE(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page, section } = params;

  try {
    await prisma.pageContent.delete({ where: { page_section: { page, section } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete page content', error);
    return NextResponse.json({ error: 'Unable to delete page content' }, { status: 500 });
  }
}
