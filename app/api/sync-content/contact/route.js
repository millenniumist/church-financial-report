import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchSheetData, parseJSON, createColumnMap } from '@/lib/google-sheets';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

async function fetchAndParseContact() {
  // Fetch data from Google Sheets
  const rows = await fetchSheetData('ContactInfo');

  if (!rows || rows.length < 2) {
    throw new Error('ContactInfo sheet is empty or has no data rows');
  }

  const headers = rows[0];
  const colMap = createColumnMap(headers);
  const row = rows[1]; // Single row table

  logger.debug({ columnMap: colMap }, 'Column map created for ContactInfo sheet');

  const contact = {
    name: parseJSON(row[colMap['name']]) || { th: '', en: '' },
    phone: row[colMap['phone']] || '',
    email: row[colMap['email']] || '',
    address: parseJSON(row[colMap['address']]) || { th: '', en: '' },
    social: parseJSON(row[colMap['social']]) || {},
    mapEmbedUrl: row[colMap['mapembedurl']] || null,
    coordinates: parseJSON(row[colMap['coordinates']]) || {},
    worshipTimes: parseJSON(row[colMap['worshiptimes']]) || []
  };

  logger.info('Contact info parsed from Google Sheets');
  return contact;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_contact_${Date.now()}`;

  logger.info({ requestId }, 'Contact sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch and parse contact from Google Sheets
    const contact = await fetchAndParseContact();

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
