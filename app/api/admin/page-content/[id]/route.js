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

export async function GET(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const record = await prisma.pageContent.findUnique({ where: { id } });

  if (!record) {
    return NextResponse.json({ error: 'Page section not found' }, { status: 404 });
  }

  return NextResponse.json({ section: toResponse(record) });
}

export async function PATCH(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const record = await prisma.pageContent.update({
      where: { id },
      data: {
        page: body.page ?? undefined,
        section: body.section ?? undefined,
        title: body.title ? normalizeLocalized(body.title) : undefined,
        subtitle: body.subtitle ? normalizeLocalized(body.subtitle) : undefined,
        description: body.description ? normalizeLocalized(body.description) : undefined,
        body: body.body !== undefined ? parseJsonMaybe(body.body) : undefined,
        metadata: body.metadata !== undefined ? parseJsonMaybe(body.metadata) : undefined,
      },
    });

    return NextResponse.json({ success: true, section: toResponse(record) });
  } catch (error) {
    console.error('Failed to update page content', error);
    return NextResponse.json(
      { error: 'Failed to update page section (ensure uniqueness).' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.pageContent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete page content', error);
    return NextResponse.json({ error: 'Failed to delete page section' }, { status: 500 });
  }
}
