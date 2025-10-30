import { google } from 'googleapis';
import fs from 'fs';
import { getCachedData, setCachedData } from './cache';

async function getAuthClient() {
  // Load service account credentials
  // For Vercel: use GOOGLE_SERVICE_ACCOUNT_JSON environment variable
  // For local: use file path from GOOGLE_SERVICE_ACCOUNT_PATH
  let credentials;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // Production (Vercel): Use JSON string from environment variable
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
    // Local development: Read from file
    credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
  } else {
    throw new Error('Missing Google Service Account credentials');
  }

  // Create auth client
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return await auth.getClient();
}

export async function getFinancialData() {
  // Check cache first
  const cached = getCachedData();
  if (cached) {
    console.log('Returning cached financial data');
    return cached;
  }

  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Monthly!AF:AR',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return { income: [], expenses: [], totals: { income: 0, expenses: 0, balance: 0 } };
    }

    // Process and aggregate data
    const data = aggregateFinancialData(rows);
    
    // Cache the result
    setCachedData(data);
    
    return data;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      hasServiceAccountJson: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      hasServiceAccountPath: !!process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    });
    throw new Error(`Failed to fetch financial data: ${error.message}`);
  }
}

export async function getProjectData() {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Project!A:C',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return { projects: [] };
    }

    // Process project data
    return processProjectData(rows);
  } catch (error) {
    console.error('Error fetching project data from Google Sheets:', error);
    throw new Error(`Failed to fetch project data: ${error.message}`);
  }
}

function aggregateFinancialData(rows) {
  const income = [];
  const expenses = [];
  const monthlyData = [];


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
    }
    // Check for "Total Expense" FIRST
    else if (lowerCol.includes('total expense') || firstCol === 'Total Expense') {
      totalExpenseRow = i;
    }
    // Check for "Total Sum" or balance row
    else if (lowerCol.includes('total sum') || firstCol === 'Total Sum') {
      totalSumRow = i;
    }
    // Check for "Income" header (row before income categories)
    else if (lowerCol === 'income' || firstCol === 'Income') {
      incomeStartRow = i + 1;
    }
    // Check for "Expense" header
    else if (lowerCol === 'expense' || firstCol === 'Expense') {
      expenseStartRow = i + 1;
    }
  }

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
    if (incomeStartRow > 0 && incomeEndRow > 0) {
      for (let i = incomeStartRow; i <= incomeEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (!categoryName) continue;

        const value = parseFloat(rows[i][col]?.toString().replace(/,/g, '')) || 0;

        if (value > 0) {
          incomeDetails.push({ category: categoryName, amount: value });
        }
      }
    }

    // Process expense categories for this month
    if (expenseStartRow > 0 && expenseEndRow > 0) {
      for (let i = expenseStartRow; i <= expenseEndRow; i++) {
        if (!rows[i]) continue;
        const categoryName = rows[i][0]?.toString().trim();
        if (!categoryName) continue;

        const value = parseFloat(rows[i][col]?.toString().replace(/,/g, '')) || 0;

        if (value > 0) {
          expenseDetails.push({ category: categoryName, amount: value });
        }
      }
    }

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

  // Process income totals (show ALL categories, even if zero)
  if (incomeStartRow > 0 && incomeEndRow > 0) {
    for (let i = incomeStartRow; i <= incomeEndRow; i++) {
      if (!rows[i]) {
        continue;
      }
      const categoryName = rows[i][0]?.toString().trim();
      if (!categoryName) {
        continue;
      }

      let totalAmount = 0;

      for (let col = 1; col <= 12; col++) {
        if (rows[i][col]) {
          const numValue = parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
          totalAmount += numValue;
        }
      }

      // Include all categories, even with zero amount
      income.push({ category: categoryName, amount: totalAmount });
    }
  }

  // Process expense totals (show ALL categories, even if zero)
  if (expenseStartRow > 0 && expenseEndRow > 0) {
    for (let i = expenseStartRow; i <= expenseEndRow; i++) {
      if (!rows[i]) {
        continue;
      }
      const categoryName = rows[i][0]?.toString().trim();
      if (!categoryName) {
        continue;
      }

      let totalAmount = 0;

      for (let col = 1; col <= 12; col++) {
        if (rows[i][col]) {
          const numValue = parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
          totalAmount += numValue;
        }
      }

      // Include all categories, even with zero amount
      expenses.push({ category: categoryName, amount: totalAmount });
    }
  }

  // Get totals
  let totalIncome = 0;
  let totalExpenses = 0;

  if (totalIncomeRow > 0 && rows[totalIncomeRow]) {
    for (let col = 1; col <= 12; col++) {
      if (rows[totalIncomeRow][col]) {
        const numValue = parseFloat(rows[totalIncomeRow][col].toString().replace(/,/g, '')) || 0;
        totalIncome += numValue;
      }
    }
  }

  if (totalExpenseRow > 0 && rows[totalExpenseRow]) {
    for (let col = 1; col <= 12; col++) {
      if (rows[totalExpenseRow][col]) {
        const numValue = parseFloat(rows[totalExpenseRow][col].toString().replace(/,/g, '')) || 0;
        totalExpenses += numValue;
      }
    }
  }

  const balance = totalIncome - totalExpenses;

  return {
    income,
    expenses,
    monthlyData,
    year: displayYear,
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      balance
    }
  };
}

function processProjectData(rows) {
  // Structure:
  // Row 0: Header ["Project", "เป้าหมาย", "เงินถวายปัจจุบัน"]
  // Rows 1+: [name, goal, current]

  const projects = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i] || !rows[i][0]) continue;

    const name = rows[i][0];
    const goal = parseFloat(rows[i][1]?.toString().replace(/,/g, '')) || 0;
    const current = parseFloat(rows[i][2]?.toString().replace(/,/g, '')) || 0;

    if (goal > 0) {
      projects.push({
        name,
        goal,
        current,
        percentage: goal > 0 ? Math.round((current / goal) * 100) : 0
      });
    }
  }

  return { projects };
}