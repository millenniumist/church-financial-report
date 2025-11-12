import { NextResponse } from 'next/server';
import { getBulletins } from '@/lib/bulletins';

// GET - Public endpoint to list bulletins
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getBulletins({ page, limit, activeOnly: true });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bulletins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulletins', details: error.message },
      { status: 500 }
    );
  }
}
