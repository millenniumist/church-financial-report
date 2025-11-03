import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_contact_${Date.now()}`;

  logger.info({ requestId }, 'Contact sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contact} = body;

    if (!contact) {
      return NextResponse.json({ error: 'contact object is required' }, { status: 400 });
    }

    const data = {
      id: 1, // Always use ID 1 (single row table)
      name: contact.name || { th: '', en: '' },
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || { th: '', en: '' },
      social: contact.social || {},
      mapEmbedUrl: contact.mapEmbedUrl || null,
      coordinates: contact.coordinates || {},
      worshipTimes: contact.worshipTimes || []
    };

    // Upsert (create or update)
    await prisma.contactInfo.upsert({
      where: { id: 1 },
      create: data,
      update: data
    });

    const duration = Date.now() - startTime;
    logger.info({ requestId, duration: `${duration}ms` }, 'Contact sync completed');

    return NextResponse.json({
      success: true,
      message: 'Contact info synced successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ requestId, duration: `${duration}ms`, error: error.message }, 'Contact sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync contact info',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
