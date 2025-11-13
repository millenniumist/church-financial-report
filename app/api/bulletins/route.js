import { NextResponse } from 'next/server';
import { getBulletins } from '@/lib/bulletins';
import { withLogging, logError } from '@/lib/logger';

// GET - Public endpoint to list bulletins
async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getBulletins({ page, limit, activeOnly: true });

    return NextResponse.json(result);
  } catch (error) {
    logError(request, error, { operation: 'fetch_bulletins' });
    return NextResponse.json(
      { error: 'Failed to fetch bulletins', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
