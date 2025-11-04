import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchSheetData, parseBoolean, parseNumber, createColumnMap } from '@/lib/google-sheets';

function verifyAuth(request) {
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) return true;
  return apiKey === expectedKey || authHeader === `Bearer ${expectedKey}`;
}

async function fetchAndParseProjects() {
  // Fetch data from Google Sheets
  const rows = await fetchSheetData('FutureProject');

  if (!rows || rows.length === 0) {
    logger.warn('FutureProject sheet is empty');
    return [];
  }

  // Find the header row (Sheet may include intro text before column names)
  let headerRowIndex = -1;
  let headers = null;
  for (let i = 0; i < rows.length; i++) {
    const normalized = rows[i]
      .filter(Boolean)
      .map((cell) => cell.toString().toLowerCase().trim());
    if (normalized.includes('name') && normalized.includes('targetamount')) {
      headerRowIndex = i;
      headers = rows[i];
      break;
    }
  }

  if (headerRowIndex === -1 || !headers) {
    logger.error('FutureProject sheet headers not found (missing name/targetAmount columns)');
    return [];
  }

  const colMap = createColumnMap(headers);
  const projects = [];

  const nameIndex = colMap['name'];
  if (nameIndex === undefined) {
    logger.error({ headers }, 'FutureProject sheet missing required "name" column');
    return [];
  }

  logger.debug(
    { columnMap: colMap, headerRowIndex },
    'Column map created for FutureProject sheet'
  );

  // Parse rows (skip header and any intro rows)
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1;
    if (!row || !row[nameIndex]) {
      logger.debug({ rowIndex: sheetRow }, 'Skipping row with no name');
      continue;
    }

    const project = {
      id: colMap['id'] !== undefined ? row[colMap['id']] || null : null,
      name: row[nameIndex],
      description:
        colMap['description'] !== undefined ? row[colMap['description']] || null : null,
      targetAmount: parseNumber(
        colMap['targetamount'] !== undefined ? row[colMap['targetamount']] : null,
        0
      ),
      currentAmount: parseNumber(
        colMap['currentamount'] !== undefined ? row[colMap['currentamount']] : null,
        0
      ),
      priority: parseNumber(
        colMap['priority'] !== undefined ? row[colMap['priority']] : null,
        0
      ),
      isActive:
        colMap['isactive'] !== undefined
          ? parseBoolean(row[colMap['isactive']])
          : true
    };

    projects.push(project);
    logger.debug({ name: project.name, rowIndex: sheetRow }, 'Parsed project from sheet');
  }

  logger.info({ count: projects.length }, 'Future projects parsed from Google Sheets');
  return projects;
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_projects_${Date.now()}`;

  logger.info({ requestId }, 'Future projects sync started');

  try {
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch and parse projects from Google Sheets
    const projects = await fetchAndParseProjects();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const project of projects) {
      const { id, name, description, targetAmount, currentAmount, priority, isActive } = project;

      if (!name) {
        logger.warn({ project }, 'Project missing name, skipping');
        skipped++;
        continue;
      }

      // If ID is provided, try to update by ID, otherwise use name to find existing
      let existing = null;
      if (id) {
        existing = await prisma.futureProject.findUnique({
          where: { id }
        });
      } else {
        // Try to find by name if no ID provided
        existing = await prisma.futureProject.findFirst({
          where: { name }
        });
      }

      const data = {
        name,
        description: description || null,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : 0,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : 0,
        priority: priority !== undefined ? Number(priority) : 0,
        isActive: isActive !== undefined ? isActive : true
      };

      if (existing) {
        await prisma.futureProject.update({
          where: { id: existing.id },
          data
        });
        updated++;
      } else {
        await prisma.futureProject.create({ data });
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
    }, 'Future projects sync completed');

    return NextResponse.json({
      success: true,
      message: `Synced ${projects.length} future projects`,
      created,
      updated,
      skipped,
      total: projects.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ requestId, duration: `${duration}ms`, error: error.message }, 'Future projects sync failed');

    return NextResponse.json({
      success: false,
      error: 'Failed to sync future projects',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
