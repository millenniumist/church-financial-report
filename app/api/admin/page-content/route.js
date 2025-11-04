import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';

const emptyLocalized = { th: '', en: '' };

function normalizeLocalized(value = {}) {
  if (typeof value === 'string') {
    return { th: value, en: value };
  }

  return {
    th: value.th?.toString().trim() ?? '',
    en: value.en?.toString().trim() ?? '',
  };
}

function parseJsonMaybe(value) {
  if (value === null || value === undefined) return null;
  const trimmed = value.toString().trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function toResponse(record) {
  return {
    id: record.id,
    page: record.page,
    section: record.section,
    title: { ...emptyLocalized, ...(record.title ?? {}) },
    subtitle: { ...emptyLocalized, ...(record.subtitle ?? {}) },
    description: { ...emptyLocalized, ...(record.description ?? {}) },
    body: record.body ?? null,
    metadata: record.metadata ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function GET(request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageFilter = searchParams.get('page') || undefined;

  const records = await prisma.pageContent.findMany({
    where: pageFilter ? { page: pageFilter } : undefined,
    orderBy: [{ page: 'asc' }, { section: 'asc' }],
  });

  return NextResponse.json({ sections: records.map(toResponse) });
}

export async function POST(request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.page || !body.section) {
    return NextResponse.json(
      { error: 'Both page and section identifiers are required.' },
      { status: 400 }
    );
  }

  try {
    const record = await prisma.pageContent.create({
      data: {
        page: body.page,
        section: body.section,
        title: normalizeLocalized(body.title),
        subtitle: normalizeLocalized(body.subtitle),
        description: normalizeLocalized(body.description),
        body: parseJsonMaybe(body.body),
        metadata: parseJsonMaybe(body.metadata),
      },
    });

    return NextResponse.json(
      { success: true, section: toResponse(record) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create page content', error);
    return NextResponse.json(
      { error: 'Failed to create page section. Ensure page + section is unique.' },
      { status: 500 }
    );
  }
}
