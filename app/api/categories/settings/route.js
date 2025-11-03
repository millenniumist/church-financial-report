import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, must-revalidate',
};

// GET - Retrieve category settings
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getFullYear();

  try {
    const settings = await prisma.categorySettings.findUnique({
      where: { year },
    });

    if (settings) {
      return NextResponse.json(settings.settings, {
        headers: CACHE_HEADERS,
      });
    }

    // Return default empty settings if none exist
    return NextResponse.json(
      {
        incomeRows: [],
        expenseRows: [],
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to load category settings', error);
    return NextResponse.json(
      { error: 'Unable to load category settings' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

// POST - Save category settings
export async function POST(request) {
  try {
    const body = await request.json();
    const year = body?.year ? Number.parseInt(body.year, 10) : new Date().getFullYear();
    const settings = body?.settings;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    // Upsert the settings
    const result = await prisma.categorySettings.upsert({
      where: { year },
      create: {
        year,
        settings,
      },
      update: {
        settings,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Settings saved successfully',
        year,
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to save category settings', error);
    return NextResponse.json(
      { error: 'Unable to save category settings', details: error.message },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

// PUT - Update individual category
export async function PUT(request) {
  try {
    const body = await request.json();
    const { code, visible, aggregateInto } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Category code is required' },
        { status: 400, headers: CACHE_HEADERS }
      );
    }

    // Update the category
    const category = await prisma.financialCategory.update({
      where: { code },
      data: {
        ...(typeof visible !== 'undefined' && { visible }),
        ...(aggregateInto !== undefined && { aggregateInto }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Category updated successfully',
        category,
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error('Failed to update category', error);
    return NextResponse.json(
      { error: 'Unable to update category', details: error.message },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

// DELETE - Reset category settings
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? Number.parseInt(yearParam, 10) : new Date().getFullYear();

  try {
    await prisma.categorySettings.delete({
      where: { year },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Settings reset successfully',
      },
      {
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    // If settings don't exist, that's okay
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: true,
          message: 'No settings to reset',
        },
        {
          headers: CACHE_HEADERS,
        }
      );
    }

    console.error('Failed to reset category settings', error);
    return NextResponse.json(
      { error: 'Unable to reset category settings', details: error.message },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}
