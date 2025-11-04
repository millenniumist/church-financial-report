import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchSheetData, parseJSON, parseBoolean, parseNumber, createColumnMap } from '@/lib/google-sheets';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

async function fetchAndParseNavigation() {
  // Fetch data from Google Sheets
  const rows = await fetchSheetData('NavigationItem');

  if (!rows || rows.length < 2) {
    logger.warn('NavigationItem sheet is empty or has no data rows');
    return [];
  }

  const headers = rows[0];
  const colMap = createColumnMap(headers);
  const navigationItems = [];

  logger.debug({ columnMap: colMap }, 'Column map created for NavigationItem sheet');

  // Parse rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[colMap['href']]) {
      logger.debug({ rowIndex: i }, 'Skipping row with no href');
      continue;
    }

    const item = {
      href: row[colMap['href']],
      label: parseJSON(row[colMap['label']]) || { th: '', en: '' },
      order: parseNumber(row[colMap['order']], 0),
      active: parseBoolean(row[colMap['active']])
    };

    navigationItems.push(item);
    logger.debug({ href: item.href }, 'Parsed navigation item from sheet');
  }

  logger.info({ count: navigationItems.length }, 'Navigation items parsed from Google Sheets');
  return navigationItems;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_nav_${Date.now()}`;

  logger.info({ requestId }, 'Navigation sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch and parse navigation items from Google Sheets
    const navigationItems = await fetchAndParseNavigation();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of navigationItems) {
      const { href, label, order, active } = item;

      if (!href) {
        logger.warn({ item }, 'Nav item missing href, skipping');
        skipped++;
        continue;
      }

      const existing = await prisma.navigationItem.findFirst({
        where: { href }
      });

      const data = {
        href,
        label: label || { th: '', en: '' },
        order: order !== undefined ? order : 0,
        active: active !== undefined ? active : true
      };

      if (existing) {
        await prisma.navigationItem.update({
          where: { id: existing.id },
          data
        });
        updated++;
      } else {
        await prisma.navigationItem.create({ data });
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
    }, 'Navigation sync completed');

    return NextResponse.json({
      success: true,
      message: `Synced ${navigationItems.length} navigation items`,
      created,
      updated,
      skipped,
      total: navigationItems.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ requestId, duration: `${duration}ms`, error: error.message }, 'Navigation sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync navigation',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
