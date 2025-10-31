import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import fs from 'fs';

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

export async function GET(request) {
  try {
    // Verify authorization (optional - add a secret token in production)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data from Google Sheets
    const rows = await fetchSheetsData();
    const monthlyRecords = parseMonthlyData(rows);

    // Sync to database
    let created = 0;
    let updated = 0;

    for (const record of monthlyRecords) {
      // Check if record exists for this month
      const existing = await prisma.financialRecord.findFirst({
        where: {
          date: record.date
        }
      });

      if (existing) {
        // Update existing record
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
      } else {
        // Create new record
        await prisma.financialRecord.create({
          data: record
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${monthlyRecords.length} financial records`,
      created,
      updated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing financial data:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync financial data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
