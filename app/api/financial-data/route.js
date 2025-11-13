import { NextResponse } from 'next/server';
import { getFinancialOverview } from '@/lib/financial';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;

  try {
    const data = await getFinancialOverview({ year });
    return NextResponse.json(data, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { year });
    return NextResponse.json(
      { error: 'Unable to load financial overview' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

async function postHandler(request) {
  const body = await request.json();
  const year = body?.year ? Number.parseInt(body.year, 10) : undefined;
  const settings = body?.settings ?? {};

  try {
    const data = await getFinancialOverview({ year, settings });
    return NextResponse.json(data, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { year, settings });
    return NextResponse.json(
      { error: 'Unable to load financial overview' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
export const POST = withLogging(postHandler);
