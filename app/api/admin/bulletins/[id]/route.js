import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getBulletinById, updateBulletin, deleteBulletin } from '@/lib/bulletins';

// GET - Get single bulletin
export async function GET(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bulletin = await getBulletinById(params.id);

    if (!bulletin) {
      return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 });
    }

    return NextResponse.json(bulletin);
  } catch (error) {
    console.error('Error fetching bulletin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulletin', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update bulletin
export async function PATCH(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { titleTh, titleEn, isActive } = body;

    const updateData = {};

    if (titleTh !== undefined || titleEn !== undefined) {
      const bulletin = await getBulletinById(params.id);
      if (!bulletin) {
        return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 });
      }

      updateData.title = {
        th: titleTh !== undefined ? titleTh : bulletin.title.th,
        en: titleEn !== undefined ? titleEn : bulletin.title.en,
      };
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const bulletin = await updateBulletin(params.id, updateData);

    return NextResponse.json(bulletin);
  } catch (error) {
    console.error('Error updating bulletin:', error);
    return NextResponse.json(
      { error: 'Failed to update bulletin', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete bulletin
export async function DELETE(request, { params }) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteBulletin(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    return NextResponse.json(
      { error: 'Failed to delete bulletin', details: error.message },
      { status: 500 }
    );
  }
}
