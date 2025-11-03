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
  const requestId = `sync_pages_${Date.now()}`;

  logger.info({ requestId }, 'Page content sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageContents } = body;

    if (!Array.isArray(pageContents)) {
      return NextResponse.json({ error: 'pageContents array is required' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const content of pageContents) {
      const { page, section, title, subtitle, description, body, metadata } = content;

      if (!page || !section) {
        logger.warn({ content }, 'Page content missing page or section, skipping');
        skipped++;
        continue;
      }

      const existing = await prisma.pageContent.findUnique({
        where: {
          page_section: { page, section }
        }
      });

      const data = {
        page,
        section,
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        body: body || null,
        metadata: metadata || null
      };

      if (existing) {
        await prisma.pageContent.update({
          where: {
            page_section: { page, section }
          },
          data
        });
        updated++;
      } else {
        await prisma.pageContent.create({ data });
        created++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      created,
      updated,
      skipped
    }, 'Page content sync completed');

    return NextResponse.json({
      success: true,
      message: `Synced ${pageContents.length} page contents`,
      created,
      updated,
      skipped,
      total: pageContents.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ requestId, duration: `${duration}ms`, error: error.message }, 'Page content sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync page content',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
