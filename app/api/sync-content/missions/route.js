import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchSheetData, parseJSON, parseBoolean, createColumnMap } from '@/lib/google-sheets';

// Verify API key for security
function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) {
    logger.warn('SYNC_API_KEY not configured - API is unsecured!');
    return true;
  }

  if (apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`) {
    return true;
  }

  return false;
}

async function fetchAndParseMissions() {
  // Fetch data from Google Sheets
  const rows = await fetchSheetData('Mission');

  if (!rows || rows.length < 2) {
    logger.warn('Mission sheet is empty or has no data rows');
    return [];
  }

  const headers = rows[0];
  const colMap = createColumnMap(headers);
  const missions = [];

  logger.debug({ columnMap: colMap }, 'Column map created for Mission sheet');

  // Parse rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[colMap['slug']]) {
      logger.debug({ rowIndex: i }, 'Skipping row with no slug');
      continue;
    }

    const mission = {
      slug: row[colMap['slug']],
      title: parseJSON(row[colMap['title']]) || { th: '', en: '' },
      theme: parseJSON(row[colMap['theme']]) || { th: '', en: '' },
      summary: parseJSON(row[colMap['summary']]) || { th: '', en: '' },
      description: parseJSON(row[colMap['description']]) || { th: '', en: '' },
      focusAreas: parseJSON(row[colMap['focusareas']]) || { th: [], en: [] },
      scripture: parseJSON(row[colMap['scripture']]) || null,
      nextSteps: parseJSON(row[colMap['nextsteps']]) || { th: [], en: [] },
      pinned: parseBoolean(row[colMap['pinned']]),
      heroImageUrl: row[colMap['heroimageurl']] || null,
      startDate: row[colMap['startdate']] ? new Date(row[colMap['startdate']]).toISOString() : null,
      endDate: row[colMap['enddate']] ? new Date(row[colMap['enddate']]).toISOString() : null
    };

    missions.push(mission);
    logger.debug({ slug: mission.slug }, 'Parsed mission from sheet');
  }

  logger.info({ count: missions.length }, 'Missions parsed from Google Sheets');
  return missions;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_missions_${Date.now()}`;

  logger.info({ requestId, method: 'POST', endpoint: '/api/sync-content/missions' }, 'Mission sync started');

  try {
    if (!verifyAuth(request)) {
      logger.warn({ requestId }, 'Unauthorized sync attempt');
      return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });
    }

    // Fetch and parse missions from Google Sheets
    const missions = await fetchAndParseMissions();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const mission of missions) {
      const { slug, title, theme, summary, description, focusAreas, scripture, nextSteps, pinned, heroImageUrl, startDate, endDate } = mission;

      if (!slug) {
        logger.warn({ mission }, 'Mission missing slug, skipping');
        skipped++;
        continue;
      }

      const existing = await prisma.mission.findUnique({
        where: { slug }
      });

      const data = {
        slug,
        title: title || { th: '', en: '' },
        theme: theme || { th: '', en: '' },
        summary: summary || { th: '', en: '' },
        description: description || { th: '', en: '' },
        focusAreas: focusAreas || { th: [], en: [] },
        scripture: scripture || null,
        nextSteps: nextSteps || { th: [], en: [] },
        pinned: pinned || false,
        heroImageUrl: heroImageUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      if (existing) {
        await prisma.mission.update({
          where: { slug },
          data
        });
        updated++;
        logger.debug({ slug }, 'Mission updated');
      } else {
        await prisma.mission.create({ data });
        created++;
        logger.debug({ slug }, 'Mission created');
      }
    }

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      created,
      updated,
      skipped,
      total: missions.length
    }, 'Mission sync completed');

    return NextResponse.json({
      success: true,
      message: `Synced ${missions.length} missions`,
      created,
      updated,
      skipped,
      total: missions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      requestId,
      duration: `${duration}ms`,
      error: { message: error.message, stack: error.stack }
    }, 'Mission sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync missions',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
