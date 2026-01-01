import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const disabledPaths = await prisma.pathConfig.findMany({
      where: {
        isEnabled: false,
      },
      select: {
        path: true,
      },
    });

    const paths = disabledPaths.map(p => p.path);

    return NextResponse.json({ paths }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    console.error('Failed to fetch path config:', error);
    return NextResponse.json({ paths: [] }, { status: 500 });
  }
}
