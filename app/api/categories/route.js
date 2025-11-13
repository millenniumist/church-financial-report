import { NextResponse } from 'next/server';
import { getFinancialCategories } from '@/lib/financial';
import { withLogging, logError } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

async function getHandler(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;

  try {
    const categories = await getFinancialCategories({ year });
    return NextResponse.json(categories, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logError(request, error, { operation: 'load_financial_categories', year });
    return NextResponse.json(
      { error: 'Unable to load financial categories' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export const GET = withLogging(getHandler);
