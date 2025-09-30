import { google } from 'googleapis';
import fs from 'fs';

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
    return aggregateFinancialData(rows);
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
  // Structure:
  // Row 0: "Income" header with month names
  // Rows 1-7: Income categories
  // Row 8: "Expense" header
  // Rows 9-15: Expense categories
  // Row 16: Total Income
  // Row 17: Total Expense
  // Row 18: Total Sum (balance)

  const income = [];
  const expenses = [];
  const monthlyData = [];

  // Get month names from header row and extract year
  const months = rows[0] ? rows[0].slice(1, 13) : [];
  const year = rows[0] && rows[0][1] ? rows[0][1].match(/\d{2,4}$/) : null;
  const displayYear = year ? (year[0].length === 2 ? '20' + year[0] : year[0]) : new Date().getFullYear();

  // Extract monthly data
  for (let col = 1; col <= 12; col++) {
    const monthName = months[col - 1] || `เดือน ${col}`;
    let monthIncome = 0;
    let monthExpense = 0;

    if (rows[16] && rows[16][col]) {
      monthIncome = parseFloat(rows[16][col].toString().replace(/,/g, '')) || 0;
    }
    if (rows[17] && rows[17][col]) {
      monthExpense = parseFloat(rows[17][col].toString().replace(/,/g, '')) || 0;
    }

    monthlyData.push({
      month: monthName,
      income: monthIncome,
      expense: monthExpense,
      balance: monthIncome - monthExpense
    });
  }

  // Categories to combine into "Office and Staff Expenses"
  const officeStaffCategories = [
    'ค่าธรรมเนียมและค่าใช้จ่ายทั่วไป',
    'ค่าบำรุงรักษาคริสตจักร',
    'บุคลากรและค่าตอบแทน',
    'พิธีการและกิจกรรมพิเศษ',
    'ยานพาหนะ'
  ];

  // Category display names (keep in Thai)
  const categoryMap = {
    // Income
    'ค่าบำรุงรักษาคริสตจักร': 'ค่าบำรุงรักษาคริสตจักร',
    'ดอกเบี้ย': 'ดอกเบี้ย',
    'พิธีการและกิจกรรมพิเศษ': 'พิธีการและกิจกรรมพิเศษ',
    'ยานพาหนะ': 'ยานพาหนะ',
    'อาหารและของใช้ประจำวัน': 'อาหารและของใช้ประจำวัน',
    'อื่นๆ': 'อื่นๆ',
    'เงินถวายประจำ': 'เงินถวายประจำ',

    // Expenses
    'สาธารณูปโภคและการสื่อสาร': 'สาธารณูปโภคและการสื่อสาร',
  };

  // Process income rows (1-7)
  for (let i = 1; i <= 7; i++) {
    if (!rows[i]) continue;

    const categoryName = rows[i][0];
    let totalAmount = 0;

    // Sum all monthly values (columns 1-12)
    for (let col = 1; col <= 12; col++) {
      if (rows[i][col]) {
        const numValue = parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
        totalAmount += numValue;
      }
    }

    if (totalAmount > 0) {
      const displayName = categoryMap[categoryName] || categoryName;
      income.push({ category: displayName, amount: totalAmount });
    }
  }

  // Process expense rows (9-15) - combine office/staff categories
  let officeStaffTotal = 0;
  const otherExpenses = [];

  for (let i = 9; i <= 15; i++) {
    if (!rows[i]) continue;

    const categoryName = rows[i][0];
    let totalAmount = 0;

    // Sum all monthly values (columns 1-12)
    for (let col = 1; col <= 12; col++) {
      if (rows[i][col]) {
        const numValue = parseFloat(rows[i][col].toString().replace(/,/g, '')) || 0;
        totalAmount += numValue;
      }
    }

    if (totalAmount > 0) {
      // Check if this should be combined into Office and Staff Expenses
      if (officeStaffCategories.includes(categoryName)) {
        officeStaffTotal += totalAmount;
      } else {
        const displayName = categoryMap[categoryName] || categoryName;
        otherExpenses.push({ category: displayName, amount: totalAmount });
      }
    }
  }

  // Add combined Office and Staff Expenses first
  if (officeStaffTotal > 0) {
    expenses.push({ category: 'ค่าใช้จ่ายสำนักงานและบุคลากร', amount: officeStaffTotal });
  }

  // Add other expenses
  expenses.push(...otherExpenses);

  // Get totals from pre-calculated rows
  let totalIncome = 0;
  let totalExpenses = 0;
  let balance = 0;

  if (rows[16]) { // Total Income row
    for (let col = 1; col <= 12; col++) {
      if (rows[16][col]) {
        const numValue = parseFloat(rows[16][col].toString().replace(/,/g, '')) || 0;
        totalIncome += numValue;
      }
    }
  }

  if (rows[17]) { // Total Expense row
    for (let col = 1; col <= 12; col++) {
      if (rows[17][col]) {
        const numValue = parseFloat(rows[17][col].toString().replace(/,/g, '')) || 0;
        totalExpenses += numValue;
      }
    }
  }

  balance = totalIncome - totalExpenses;

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