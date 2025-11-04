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

async function fetchAndParsePageContent() {
  // Fetch data from Google Sheets
  const rows = await fetchSheetData('PageContent');

  if (!rows || rows.length < 2) {
    logger.warn('PageContent sheet is empty or has no data rows');
    return [];
  }

  const headers = rows[0];
  const colMap = createColumnMap(headers);
  const pageContents = [];

  logger.debug({ columnMap: colMap }, 'Column map created for PageContent sheet');

  // Parse rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[colMap['page']] || !row[colMap['section']]) {
      logger.debug({ rowIndex: i }, 'Skipping row with no page or section');
      continue;
    }

    const content = {
      page: row[colMap['page']],
      section: row[colMap['section']],
      title: parseJSON(row[colMap['title']]) || null,
      subtitle: parseJSON(row[colMap['subtitle']]) || null,
      description: parseJSON(row[colMap['description']]) || null,
      body: parseJSON(row[colMap['body']]) || null,
      metadata: parseJSON(row[colMap['metadata']]) || null
    };

    pageContents.push(content);
    logger.debug({ page: content.page, section: content.section }, 'Parsed page content from sheet');
  }

  logger.info({ count: pageContents.length }, 'Page contents parsed from Google Sheets');
  return pageContents;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_pages_${Date.now()}`;

  logger.info({ requestId }, 'Page content sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch and parse page contents from Google Sheets
    const pageContents = await fetchAndParsePageContent();

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
