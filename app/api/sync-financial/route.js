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

async function fetchSheetsData(range = 'Monthly!AF:AZ') {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Fetch with a wider range to handle multiple years
  // AF = categories, AG onwards = monthly data
  // Default to AF:AZ (20 columns = ~19 months of data)
  // You can expand this as needed (AF:BZ for more years)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range,
  });

  return response.data.values;
}

function getMonthBounds(year, monthIndex) {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
}

function extractCategories(rows) {
  const incomeCategories = [];
  const expenseCategories = [];

  // Find key markers
  let incomeHeaderRow = -1;
  let expenseHeaderRow = -1;
  let totalIncomeRow = -1;

  for (let i = 0; i < rows.length; i++) {
    const firstCol = rows[i][0]?.toString().trim().toLowerCase();
    if (!firstCol) continue;

    if (firstCol === 'income') {
      incomeHeaderRow = i;
    } else if (firstCol === 'expense') {
      expenseHeaderRow = i;
    } else if (firstCol.includes('total income')) {
      totalIncomeRow = i;
    }
  }

  const incomeStartRow = incomeHeaderRow > -1 ? incomeHeaderRow + 1 : -1;
  const expenseStartRow = expenseHeaderRow > -1 ? expenseHeaderRow + 1 : -1;
  const incomeEndRow = expenseHeaderRow > -1 ? expenseHeaderRow - 1 : totalIncomeRow > -1 ? totalIncomeRow - 1 : -1;
  const expenseEndRow = totalIncomeRow > -1 ? totalIncomeRow - 1 : -1;

  // Extract income categories
  if (incomeStartRow > 0 && incomeEndRow >= incomeStartRow) {
    for (let row = incomeStartRow; row <= incomeEndRow; row++) {
      const categoryName = rows[row]?.[0]?.toString().trim();
      if (categoryName) {
        incomeCategories.push(categoryName);
      }
    }
  }

  // Extract expense categories
  if (expenseStartRow > 0 && expenseEndRow >= expenseStartRow) {
    for (let row = expenseStartRow; row <= expenseEndRow; row++) {
      const categoryName = rows[row]?.[0]?.toString().trim();
      if (categoryName) {
        expenseCategories.push(categoryName);
      }
    }
  }

  return { incomeCategories, expenseCategories };
}

function parseMonthlyData(rows) {
  if (!rows || rows.length === 0) return [];

  const monthlyRecords = [];

  // Find key markers
  let incomeHeaderRow = -1;
  let expenseHeaderRow = -1;
  let totalIncomeRow = -1;
  let totalExpenseRow = -1;
  let totalSumRow = -1;

  for (let i = 0; i < rows.length; i++) {
    const firstCol = rows[i][0]?.toString().trim().toLowerCase();
    if (!firstCol) continue;

    if (firstCol === 'income') {
      incomeHeaderRow = i;
    } else if (firstCol === 'expense') {
      expenseHeaderRow = i;
    } else if (firstCol.includes('total income')) {
      totalIncomeRow = i;
    } else if (firstCol.includes('total expense')) {
      totalExpenseRow = i;
    } else if (firstCol.includes('total sum')) {
      totalSumRow = i;
    }
  }

  const incomeStartRow = incomeHeaderRow > -1 ? incomeHeaderRow + 1 : -1;
  const expenseStartRow = expenseHeaderRow > -1 ? expenseHeaderRow + 1 : -1;

  const incomeEndRow =
    expenseHeaderRow > -1 ? expenseHeaderRow - 1 : totalIncomeRow > -1 ? totalIncomeRow - 1 : -1;
  const expenseEndRow = totalIncomeRow > -1 ? totalIncomeRow - 1 : -1;

  // Get header row to process all available columns
  const headerRow = rows[0] || [];
  const totalColumns = headerRow.length - 1; // Exclude first column (category names)

  // Extract data for each month column
  for (let col = 1; col <= totalColumns; col++) {
    // Skip if no header for this column
    if (!headerRow[col]) continue;

    const monthHeader = headerRow[col].toString().trim();
    if (!monthHeader) continue;

    // Extract year from month header (e.g., "มกราคม 2025" or "ม.ค. 25")
    const yearMatch = monthHeader.match(/\d{2,4}$/);
    const year = yearMatch
      ? (yearMatch[0].length === 2 ? 2000 + parseInt(yearMatch[0]) : parseInt(yearMatch[0]))
      : new Date().getFullYear();

    const monthName = monthHeader;
    let income = 0;
    let expenses = 0;
    let balance = 0;
    const incomeDetails = [];
    const expenseDetails = [];

    if (incomeStartRow > 0 && incomeEndRow >= incomeStartRow) {
      for (let row = incomeStartRow; row <= incomeEndRow; row++) {
        const categoryName = rows[row]?.[0]?.toString().trim();
        if (!categoryName) continue;
        const value = rows[row]?.[col];
        if (!value) continue;
        const amount = parseFloat(value.toString().replace(/,/g, '')) || 0;
        if (amount === 0) continue;
        incomeDetails.push({
          id: categoryName,
          label: categoryName,
          amount,
        });
      }
    }

    if (expenseStartRow > 0 && expenseEndRow >= expenseStartRow) {
      for (let row = expenseStartRow; row <= expenseEndRow; row++) {
        const categoryName = rows[row]?.[0]?.toString().trim();
        if (!categoryName) continue;
        const value = rows[row]?.[col];
        if (!value) continue;
        const amount = parseFloat(value.toString().replace(/,/g, '')) || 0;
        if (amount === 0) continue;
        expenseDetails.push({
          id: categoryName,
          label: categoryName,
          amount,
        });
      }
    }

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

    // Determine month index from month name
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                             'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    let monthIndex = -1;
    for (let i = 0; i < thaiMonths.length; i++) {
      if (monthName.includes(thaiMonths[i]) || monthName.includes(thaiMonthsShort[i])) {
        monthIndex = i;
        break;
      }
    }

    // Fallback: use column position modulo 12
    if (monthIndex === -1) {
      monthIndex = (col - 1) % 12;
    }

    // Create date for the 1st of each month
    const { start } = getMonthBounds(year, monthIndex);

    monthlyRecords.push({
      date: start,
      income,
      expenses,
      balance,
      notes: monthName,
      incomeDetails,
      expenseDetails,
      monthIndex,
      year,
    });
  }

  return monthlyRecords;
}

async function syncCategories(rows, year) {
  const { incomeCategories, expenseCategories } = extractCategories(rows);

  logger.info({
    incomeCount: incomeCategories.length,
    expenseCount: expenseCategories.length,
    year
  }, 'Extracted categories from sheets');

  let categoriesCreated = 0;
  let categoriesUpdated = 0;

  // Sync income categories
  for (let i = 0; i < incomeCategories.length; i++) {
    const categoryName = incomeCategories[i];
    const code = categoryName; // Use name as code for now

    const existing = await prisma.financialCategory.findUnique({
      where: { code }
    });

    if (existing) {
      // Update if needed
      if (existing.name !== categoryName || existing.type !== 'income' || existing.order !== i) {
        await prisma.financialCategory.update({
          where: { code },
          data: {
            name: categoryName,
            type: 'income',
            order: i,
            year: null // Apply to all years
          }
        });
        categoriesUpdated++;
      }
    } else {
      // Create new category
      await prisma.financialCategory.create({
        data: {
          code,
          name: categoryName,
          type: 'income',
          order: i,
          visible: true,
          year: null // Apply to all years
        }
      });
      categoriesCreated++;
    }
  }

  // Sync expense categories
  for (let i = 0; i < expenseCategories.length; i++) {
    const categoryName = expenseCategories[i];
    const code = categoryName; // Use name as code for now

    const existing = await prisma.financialCategory.findUnique({
      where: { code }
    });

    if (existing) {
      // Update if needed
      if (existing.name !== categoryName || existing.type !== 'expense' || existing.order !== i) {
        await prisma.financialCategory.update({
          where: { code },
          data: {
            name: categoryName,
            type: 'expense',
            order: i,
            year: null // Apply to all years
          }
        });
        categoriesUpdated++;
      }
    } else {
      // Create new category
      await prisma.financialCategory.create({
        data: {
          code,
          name: categoryName,
          type: 'expense',
          order: i,
          visible: true,
          year: null // Apply to all years
        }
      });
      categoriesCreated++;
    }
  }

  logger.info({
    categoriesCreated,
    categoriesUpdated,
    totalCategories: incomeCategories.length + expenseCategories.length
  }, 'Categories sync completed');

  return { categoriesCreated, categoriesUpdated };
}

async function syncFinancialData() {
  // Fetch data from Google Sheets
  logger.info({ spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID }, 'Fetching data from Google Sheets');
  const rows = await fetchSheetsData();
  logger.info({ rowsCount: rows?.length || 0 }, 'Data fetched from Google Sheets');

  const monthlyRecords = parseMonthlyData(rows);
  logger.info({ recordsCount: monthlyRecords.length }, 'Parsed monthly records from sheets');

  // Extract year from first record
  const year = monthlyRecords.length > 0 ? monthlyRecords[0].year : new Date().getFullYear();

  // Sync categories
  const categoryResult = await syncCategories(rows, year);

  // Sync to database
  let created = 0;
  let updated = 0;
  let skipped = 0;

  logger.info({ recordsToProcess: monthlyRecords.length }, 'Starting database sync');

  for (const record of monthlyRecords) {
    // Check if record exists for this month (UTC range to avoid timezone drift)
    const { start, end } = getMonthBounds(record.year, record.monthIndex);
    const existingRecords = await prisma.financialRecord.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const existing = existingRecords[0];

    if (existingRecords.length > 1) {
      const duplicateIds = existingRecords.slice(1).map((item) => item.id);
      await prisma.financialRecord.deleteMany({
        where: { id: { in: duplicateIds } }
      });
      logger.warn({
        date: record.date,
        duplicateCount: duplicateIds.length
      }, 'Removed duplicate financial records for month');
    }

    if (existing) {
      // Only update if data has changed
      if (
        existing.income !== record.income ||
        existing.expenses !== record.expenses ||
        existing.balance !== record.balance ||
        JSON.stringify(existing.incomeDetails ?? []) !== JSON.stringify(record.incomeDetails ?? []) ||
        JSON.stringify(existing.expenseDetails ?? []) !== JSON.stringify(record.expenseDetails ?? [])
      ) {
        await prisma.financialRecord.update({
          where: { id: existing.id },
          data: {
            income: record.income,
            expenses: record.expenses,
            balance: record.balance,
            notes: record.notes,
            incomeDetails: record.incomeDetails,
            expenseDetails: record.expenseDetails,
            date: start
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
        data: {
          date: start,
          income: record.income,
          expenses: record.expenses,
          balance: record.balance,
          notes: record.notes,
          incomeDetails: record.incomeDetails,
          expenseDetails: record.expenseDetails
        }
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
    total: monthlyRecords.length,
    categoriesCreated: categoryResult.categoriesCreated,
    categoriesUpdated: categoryResult.categoriesUpdated
  }, 'Database sync completed');

  return {
    success: true,
    message: `Synced ${monthlyRecords.length} financial records and ${categoryResult.categoriesCreated + categoryResult.categoriesUpdated} categories`,
    records: {
      created,
      updated,
      skipped,
      total: monthlyRecords.length
    },
    categories: {
      created: categoryResult.categoriesCreated,
      updated: categoryResult.categoriesUpdated
    },
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
