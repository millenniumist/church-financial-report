import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';

function normalizeLabel(label = {}) {
  if (typeof label === 'string') {
    return { th: label, en: label };
  }
  return {
    th: label.th?.toString().trim() ?? '',
    en: label.en?.toString().trim() ?? '',
  };
}

function toResponse(item) {
  return {
    id: item.id,
    href: item.href,
    order: item.order,
    active: item.active,
    label: {
      th: item.label?.th ?? '',
      en: item.label?.en ?? '',
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function GET() {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({
    items: items.map(toResponse),
  });
}

export async function POST(request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.href) {
    return NextResponse.json({ error: 'Link path (href) is required' }, { status: 400 });
  }

  try {
    const item = await prisma.navigationItem.create({
      data: {
        href: body.href,
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        active: body.active !== false,
        label: normalizeLabel(body.label ?? { th: body.labelTh, en: body.labelEn }),
      },
    });

    return NextResponse.json({ success: true, item: toResponse(item) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create navigation item', error);
    return NextResponse.json({ error: 'Failed to create navigation item' }, { status: 500 });
  }
}
