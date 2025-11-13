import { NextResponse } from 'next/server';
import { getPageContent, normalizeContent, DEFAULT_LOCALE } from '@/lib/page-content';
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

async function getHandler(request, { params }) {
  const { page } = params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';
  const section = searchParams.getAll('section');

  if (!page) {
    return NextResponse.json(
      { error: 'Page parameter is required' },
      {
        status: 400,
        headers: CACHE_HEADERS,
      }
    );
  }

  try {
    const sections = section.length
      ? await getPageContent({ page, sections: section, locale })
      : await getPageContent({ page, locale });

    return NextResponse.json(
      {
        page,
        sections,
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    logError(request, error, { operation: 'fetch_page_content', page });
    return NextResponse.json(
      { error: 'Unable to load page content' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

async function postHandler(request, { params }) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { page } = params;
  const body = await request.json();
  const locale = body.locale || DEFAULT_LOCALE;

  if (!body.section) {
    return NextResponse.json({ error: 'Section identifier is required' }, { status: 400 });
  }

  try {
    const record = await prisma.pageContent.create({
      data: {
        page,
        section: body.section,
        title: body.title ?? null,
        subtitle: body.subtitle ?? null,
        description: body.description ?? null,
        body: body.body ?? null,
        metadata: body.metadata ?? null,
      },
    });

    return NextResponse.json(
      { section: normalizeContent(record, locale) },
      { status: 201 }
    );
  } catch (error) {
    logError(request, error, { operation: 'create_page_content', page, section: body.section });
    return NextResponse.json({ error: 'Unable to create page content' }, { status: 500 });
  }
}

export const GET = withLogging(getHandler);
export const POST = withLogging(postHandler);
