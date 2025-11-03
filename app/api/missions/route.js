import { NextResponse } from 'next/server';
import { getMissions } from '@/lib/missions';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '6', 10);

  const data = getMissions({
    page: Number.isNaN(page) ? 1 : page,
    pageSize: Number.isNaN(pageSize) ? 6 : pageSize,
  });

  return NextResponse.json(data);
}

