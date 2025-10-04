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

function aggregateFinancialDataWithSettings(rows, settings) {
  const income = [];
  const expenses = [];
  const monthlyData = [];

  // Debug: Log first 20 rows to understand structure
  console.log('First 20 rows of data:');
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    console.log(`Row ${i}:`, rows[i][0]);
  }

  // Dynamically detect structure
  let incomeStartRow = -1;
  let expenseStartRow = -1;
  let totalIncomeRow = -1;
  let totalExpenseRow = -1;
  let totalSumRow = -1;

  // Find key markers in the data (check "Total" markers FIRST to avoid false matches)
  for (let i = 0; i < rows.length; i++) {
    const firstCol = rows[i][0]?.toString().trim();

    if (!firstCol) continue;

    const lowerCol = firstCol.toLowerCase();

    // Check for "Total Income" FIRST
    if (lowerCol.includes('total income') || firstCol === 'Total Income') {
      totalIncomeRow = i;
      console.log('Found Total Income at row:', i);
    }
    // Check for "Total Expense" FIRST
    else if (lowerCol.includes('total expense') || firstCol === 'Total Expense') {
      totalExpenseRow = i;
      console.log('Found Total Expense at row:', i);
    }
    // Check for "Total Sum" or balance row
    else if (lowerCol.includes('total sum') || firstCol === 'Total Sum') {
      totalSumRow = i;
      console.log('Found Total Sum at row:', i);
    }
    // Check for "Income" header (row before income categories)
    else if (lowerCol === 'income' || firstCol === 'Income') {
      incomeStartRow = i + 1;
      console.log('Found Income at row:', i);
    }
    // Check for "Expense" header
    else if (lowerCol === 'expense' || firstCol === 'Expense') {
      expenseStartRow = i + 1;
      console.log('Found Expense at row:', i);
    }
  }

  console.log('Detected rows:', { incomeStartRow, expenseStartRow, totalIncomeRow, totalExpenseRow });

  // If we found expense marker, income ends just before it
  const incomeEndRow = expenseStartRow > 0 ? expenseStartRow - 2 : -1;
  // Expense ends at total income row
  const expenseEndRow = totalIncomeRow > 0 ? totalIncomeRow - 1 : -1;

  // Get month names from header row and extract year
  const months = rows[0] ? rows[0].slice(1, 13) : [];
  const year = rows[0] && rows[0][1] ? rows[0][1].match(/\d{2,4}$/) : null;
  const displayYear = year ? (year[0].length === 2 ? '20' + year[0] : year[0]) : new Date().getFullYear();

  // Extract monthly data with category details
  for (let col = 1; col <= 12; col++) {
    const monthName = months[col - 1] || `เดือน ${col}`;
    let monthIncome = 0;
    let monthExpense = 0;
    const incomeDetails = [];
    const expenseDetails = [];

    // Process income categories for this month
    const incomeAggregates = {};
    if (incomeStartRow > 0 && incomeEndRow > 0) {
      for (let i = incomeStartRow; i <= incomeEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (!categoryName) continue;

        const value = parseFloat(rows[i][col]?.toString().replace(/,/g, '')) || 0;

        if (value === 0) continue; // Skip zero values in monthly details

        const setting = settings.incomeRows?.find(r => r.id === categoryName);

        // If setting exists and should aggregate
        if (setting && setting.aggregateInto && setting.visible) {
          incomeAggregates[setting.aggregateInto] = (incomeAggregates[setting.aggregateInto] || 0) + value;
        }
        // If setting exists and visible but no aggregation, OR no setting exists (show all)
        else if (!setting || (setting && setting.visible)) {
          incomeDetails.push({ category: categoryName, amount: value });
        }
      }
    }

    // Add aggregated income items
    Object.entries(incomeAggregates).forEach(([name, amount]) => {
      incomeDetails.push({ category: name, amount });
    });

    // Process expense categories for this month
    const expenseAggregates = {};
    if (expenseStartRow > 0 && expenseEndRow > 0) {
      for (let i = expenseStartRow; i <= expenseEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (!categoryName) continue;

        const value = parseFloat(rows[i][col]?.toString().replace(/,/g, '')) || 0;

        if (value === 0) continue; // Skip zero values in monthly details

        const setting = settings.expenseRows?.find(r => r.id === categoryName);

        // If setting exists and should aggregate
        if (setting && setting.aggregateInto && setting.visible) {
          expenseAggregates[setting.aggregateInto] = (expenseAggregates[setting.aggregateInto] || 0) + value;
        }
        // If setting exists and visible but no aggregation, OR no setting exists (show all)
        else if (!setting || (setting && setting.visible)) {
          expenseDetails.push({ category: categoryName, amount: value });
        }
      }
    }

    // Add aggregated expense items
    Object.entries(expenseAggregates).forEach(([name, amount]) => {
      expenseDetails.push({ category: name, amount });
    });

    // Get totals from summary rows
    if (totalIncomeRow > 0 && rows[totalIncomeRow] && rows[totalIncomeRow][col]) {
      monthIncome = parseFloat(rows[totalIncomeRow][col].toString().replace(/,/g, '')) || 0;
    }
    if (totalExpenseRow > 0 && rows[totalExpenseRow] && rows[totalExpenseRow][col]) {
      monthExpense = parseFloat(rows[totalExpenseRow][col].toString().replace(/,/g, '')) || 0;
    }

    monthlyData.push({
      month: monthName,
      income: monthIncome,
      expense: monthExpense,
      balance: monthIncome - monthExpense,
      incomeDetails,
      expenseDetails
    });
  }

  // Process income totals
  const incomeAggregates = {};
  if (incomeStartRow > 0 && incomeEndRow > 0) {
    console.log('Processing income from row', incomeStartRow, 'to', incomeEndRow);
    for (let i = incomeStartRow; i <= incomeEndRow; i++) {
      if (!rows[i]) continue;
      const categoryName = rows[i][0]?.toString().trim();
      if (!categoryName) continue;

      let totalAmount = 0;

      for (let col = 1; col <= 12; col++) {
        if (rows[i][col]) {
          totalAmount += parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
        }
      }

      console.log('Income category:', categoryName, 'total:', totalAmount);

      // Check settings - if category exists in settings and has aggregation
      const setting = settings.incomeRows?.find(r => r.id === categoryName);

      // If setting exists and should aggregate
      if (setting && setting.aggregateInto && setting.visible) {
        incomeAggregates[setting.aggregateInto] = (incomeAggregates[setting.aggregateInto] || 0) + totalAmount;
      }
      // If setting exists and visible but no aggregation, OR no setting exists (show all)
      else if (!setting || (setting && setting.visible)) {
        income.push({ category: categoryName, amount: totalAmount });
      }
    }
  }

  Object.entries(incomeAggregates).forEach(([name, amount]) => {
    income.push({ category: name, amount });
  });

  // Process expense totals
  const expenseAggregates = {};
  if (expenseStartRow > 0 && expenseEndRow > 0) {
    console.log('Processing expense from row', expenseStartRow, 'to', expenseEndRow);
    for (let i = expenseStartRow; i <= expenseEndRow; i++) {
      if (!rows[i]) continue;
      const categoryName = rows[i][0]?.toString().trim();
      if (!categoryName) continue;

      let totalAmount = 0;

      for (let col = 1; col <= 12; col++) {
        if (rows[i][col]) {
          totalAmount += parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
        }
      }

      console.log('Expense category:', categoryName, 'total:', totalAmount);

      // Check settings - if category exists in settings and has aggregation
      const setting = settings.expenseRows?.find(r => r.id === categoryName);

      // If setting exists and should aggregate
      if (setting && setting.aggregateInto && setting.visible) {
        expenseAggregates[setting.aggregateInto] = (expenseAggregates[setting.aggregateInto] || 0) + totalAmount;
      }
      // If setting exists and visible but no aggregation, OR no setting exists (show all)
      else if (!setting || (setting && setting.visible)) {
        expenses.push({ category: categoryName, amount: totalAmount });
      }
    }
  }

  Object.entries(expenseAggregates).forEach(([name, amount]) => {
    expenses.push({ category: name, amount });
  });

  // Get totals
  let totalIncome = 0;
  let totalExpenses = 0;

  if (totalIncomeRow > 0 && rows[totalIncomeRow]) {
    for (let col = 1; col <= 12; col++) {
      if (rows[totalIncomeRow][col]) {
        totalIncome += parseFloat(rows[totalIncomeRow][col].toString().replace(/,/g, '')) || 0;
      }
    }
  }

  if (totalExpenseRow > 0 && rows[totalExpenseRow]) {
    for (let col = 1; col <= 12; col++) {
      if (rows[totalExpenseRow][col]) {
        totalExpenses += parseFloat(rows[totalExpenseRow][col].toString().replace(/,/g, '')) || 0;
      }
    }
  }

  return {
    income,
    expenses,
    monthlyData,
    year: displayYear,
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses
    }
  };
}

export async function POST(request) {
  try {
    const { settings } = await request.json();

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Monthly!AF:AR',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        income: [],
        expenses: [],
        monthlyData: [],
        totals: { income: 0, expenses: 0, balance: 0 }
      });
    }

    const data = aggregateFinancialDataWithSettings(rows, settings);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: `Failed to fetch financial data: ${error.message}` },
      { status: 500 }
    );
  }
}
