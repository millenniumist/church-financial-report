import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings - Fetch admin settings
export async function GET() {
  try {
    // Get or create admin settings (singleton pattern)
    // Note: We use the centralized prisma client which handles failover
    let settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: {
          colorTheme: 'bw',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update admin settings
export async function PUT(request) {
  try {
    const body = await request.json();
    const { colorTheme } = body;

    if (!['bw', 'lowkey'].includes(colorTheme)) {
      return NextResponse.json(
        { error: 'Invalid color theme' },
        { status: 400 }
      );
    }

    // Update or create admin settings
    const settings = await prisma.adminSettings.findFirst();
    
    let updatedSettings;
    if (settings) {
      updatedSettings = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: { colorTheme },
      });
    } else {
      updatedSettings = await prisma.adminSettings.create({
        data: { colorTheme },
      });
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update admin settings' },
      { status: 500 }
    );
  }
}
