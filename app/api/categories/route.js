import { google } from 'googleapis';
import fs from 'fs';
import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Monthly!AF:AR',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        incomeCategories: [],
        expenseCategories: []
      });
    }

    // Detect structure
    let incomeStartRow = -1;
    let expenseStartRow = -1;
    let totalIncomeRow = -1;

    for (let i = 0; i < rows.length; i++) {
      const firstCol = rows[i][0]?.toString().trim();
      if (!firstCol) continue;

      const lowerCol = firstCol.toLowerCase();

      if (lowerCol.includes('total income')) {
        totalIncomeRow = i;
      } else if (lowerCol === 'income') {
        incomeStartRow = i + 1;
      } else if (lowerCol === 'expense') {
        expenseStartRow = i + 1;
      }
    }

    const incomeEndRow = expenseStartRow > 0 ? expenseStartRow - 2 : -1;
    const expenseEndRow = totalIncomeRow > 0 ? totalIncomeRow - 1 : -1;

    // Extract income categories
    const incomeCategories = [];
    if (incomeStartRow > 0 && incomeEndRow > 0) {
      for (let i = incomeStartRow; i <= incomeEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (categoryName) {
          incomeCategories.push({
            id: categoryName,
            name: categoryName,
            visible: true,
            aggregateInto: null
          });
        }
      }
    }

    // Extract expense categories
    const expenseCategories = [];
    if (expenseStartRow > 0 && expenseEndRow > 0) {
      for (let i = expenseStartRow; i <= expenseEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (categoryName) {
          expenseCategories.push({
            id: categoryName,
            name: categoryName,
            visible: true,
            aggregateInto: null
          });
        }
      }
    }

    return NextResponse.json({
      incomeCategories,
      expenseCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: `Failed to fetch categories: ${error.message}` },
      { status: 500 }
    );
  }
}
