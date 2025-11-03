import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import fs from 'fs';
import { logger } from '@/lib/logger';

async function getAuthClient() {
  let credentials;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
    credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
  } else {
    throw new Error('Missing Google Service Account credentials');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return await auth.getClient();
}

async function fetchSheetsData() {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: 'Monthly!AF:AR',
  });

  return response.data.values;
}

function parseMonthlyData(rows) {
  if (!rows || rows.length === 0) return [];

  const monthlyRecords = [];

  // Find key markers
  let totalIncomeRow = -1;
  let totalExpenseRow = -1;
  let totalSumRow = -1;

  for (let i = 0; i < rows.length; i++) {
    const firstCol = rows[i][0]?.toString().trim().toLowerCase();
    if (!firstCol) continue;

    if (firstCol.includes('total income')) {
      totalIncomeRow = i;
    } else if (firstCol.includes('total expense')) {
      totalExpenseRow = i;
    } else if (firstCol.includes('total sum')) {
      totalSumRow = i;
    }
  }

  // Get month names and year from header
  const months = rows[0] ? rows[0].slice(1, 13) : [];
  const yearMatch = rows[0] && rows[0][1] ? rows[0][1].match(/\d{2,4}$/) : null;
  const year = yearMatch ? (yearMatch[0].length === 2 ? 2000 + parseInt(yearMatch[0]) : parseInt(yearMatch[0])) : new Date().getFullYear();

  // Extract data for each month
  for (let col = 1; col <= 12; col++) {
    const monthName = months[col - 1] || `เดือน ${col}`;
    let income = 0;
    let expenses = 0;
    let balance = 0;

    if (totalIncomeRow > 0 && rows[totalIncomeRow] && rows[totalIncomeRow][col]) {
      income = parseFloat(rows[totalIncomeRow][col].toString().replace(/,/g, '')) || 0;
    }

    if (totalExpenseRow > 0 && rows[totalExpenseRow] && rows[totalExpenseRow][col]) {
      expenses = parseFloat(rows[totalExpenseRow][col].toString().replace(/,/g, '')) || 0;
    }

    if (totalSumRow > 0 && rows[totalSumRow] && rows[totalSumRow][col]) {
      balance = parseFloat(rows[totalSumRow][col].toString().replace(/,/g, '')) || 0;
    } else {
      balance = income - expenses;
    }

    // Create date for the 1st of each month
    const monthIndex = col - 1;
    const date = new Date(year, monthIndex, 1);

    monthlyRecords.push({
      date,
      income,
      expenses,
      balance,
      notes: monthName
    });
  }

  return monthlyRecords;
}

async function syncFinancialData() {
  // Fetch data from Google Sheets
  logger.info({ spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID }, 'Fetching data from Google Sheets');
  const rows = await fetchSheetsData();
  logger.info({ rowsCount: rows?.length || 0 }, 'Data fetched from Google Sheets');

  const monthlyRecords = parseMonthlyData(rows);
  logger.info({ recordsCount: monthlyRecords.length }, 'Parsed monthly records from sheets');

  // Sync to database
  let created = 0;
  let updated = 0;
  let skipped = 0;

  logger.info({ recordsToProcess: monthlyRecords.length }, 'Starting database sync');

  for (const record of monthlyRecords) {
    // Check if record exists for this month
    const existing = await prisma.financialRecord.findFirst({
      where: {
        date: record.date
      }
    });

    if (existing) {
      // Only update if data has changed
      if (
        existing.income !== record.income ||
        existing.expenses !== record.expenses ||
        existing.balance !== record.balance
      ) {
        await prisma.financialRecord.update({
          where: { id: existing.id },
          data: {
            income: record.income,
            expenses: record.expenses,
            balance: record.balance,
            notes: record.notes
          }
        });
        updated++;
        logger.debug({
          date: record.date,
          income: record.income,
          expenses: record.expenses,
          balance: record.balance
        }, 'Record updated');
      } else {
        skipped++;
      }
    } else {
      // Create new record
      await prisma.financialRecord.create({
        data: record
      });
      created++;
      logger.debug({
        date: record.date,
        income: record.income,
        expenses: record.expenses,
        balance: record.balance
      }, 'Record created');
    }
  }

  logger.info({
    created,
    updated,
    skipped,
    total: monthlyRecords.length
  }, 'Database sync completed');

  return {
    success: true,
    message: `Synced ${monthlyRecords.length} financial records`,
    created,
    updated,
    skipped,
    total: monthlyRecords.length,
    timestamp: new Date().toISOString()
  };
}

// Verify API key for security
function verifyAuth(request) {
  // Check for API key in headers
  const apiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  // Support both x-api-key header and Bearer token
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey) {
    // If no API key is configured, allow access (development mode)
    logger.warn({
      endpoint: '/api/sync-financial',
      security: 'unsecured'
    }, 'SYNC_API_KEY not configured - API is unsecured!');
    return true;
  }

  // Check x-api-key header
  if (apiKey === expectedKey) {
    logger.info({ auth: 'x-api-key', status: 'valid' }, 'API key validated');
    return true;
  }

  // Check Bearer token
  if (authHeader === `Bearer ${expectedKey}`) {
    logger.info({ auth: 'bearer', status: 'valid' }, 'Bearer token validated');
    return true;
  }

  logger.warn({
    auth: authHeader ? 'bearer' : apiKey ? 'x-api-key' : 'none',
    status: 'invalid'
  }, 'Authentication failed');
  return false;
}

// Support both GET and POST for flexibility
export async function GET(request) {
  const startTime = Date.now();
  const requestId = `sync_${Date.now()}`;

  logger.info({
    requestId,
    method: 'GET',
    endpoint: '/api/sync-financial',
    userAgent: request.headers.get('user-agent')
  }, 'Financial sync started');

  try {
    // Verify authorization
    if (!verifyAuth(request)) {
      logger.warn({ requestId }, 'Unauthorized sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    logger.info({ requestId }, 'Starting financial data sync');
    const result = await syncFinancialData();

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total
    }, 'Financial sync completed successfully');

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      requestId,
      duration: `${duration}ms`,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    }, 'Financial sync failed');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync financial data',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const startTime = Date.now();
  const requestId = `sync_${Date.now()}`;

  logger.info({
    requestId,
    method: 'POST',
    endpoint: '/api/sync-financial',
    userAgent: request.headers.get('user-agent')
  }, 'Financial sync started');

  try {
    // Verify authorization
    if (!verifyAuth(request)) {
      logger.warn({ requestId }, 'Unauthorized sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    logger.info({ requestId }, 'Starting financial data sync');
    const result = await syncFinancialData();

    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      duration: `${duration}ms`,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total
    }, 'Financial sync completed successfully');

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({
      requestId,
      duration: `${duration}ms`,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    }, 'Financial sync failed');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync financial data',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
