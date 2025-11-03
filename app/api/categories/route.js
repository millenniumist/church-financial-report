import { NextResponse } from 'next/server';
import { getFinancialCategories } from '@/lib/financial';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : undefined;

  try {
    const categories = await getFinancialCategories({ year });
    return NextResponse.json(categories, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Failed to load financial categories', error);
    return NextResponse.json(
      { error: 'Unable to load financial categories' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
