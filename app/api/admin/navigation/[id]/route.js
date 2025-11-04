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

export async function GET(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.navigationItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ error: 'Navigation item not found' }, { status: 404 });
  }

  return NextResponse.json({ item: toResponse(item) });
}

export async function PATCH(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const item = await prisma.navigationItem.update({
      where: { id },
      data: {
        order:
          body.order !== undefined && Number.isFinite(Number(body.order))
            ? Number(body.order)
            : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
        label:
          body.label || body.labelTh || body.labelEn
            ? normalizeLabel(body.label ?? { th: body.labelTh, en: body.labelEn })
            : undefined,
      },
    });

    return NextResponse.json({ success: true, item: toResponse(item) });
  } catch (error) {
    console.error('Failed to update navigation item', error);
    return NextResponse.json({ error: 'Failed to update navigation item' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.navigationItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete navigation item', error);
    return NextResponse.json({ error: 'Failed to delete navigation item' }, { status: 500 });
  }
}
