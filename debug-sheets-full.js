const { google } = require('googleapis');
const fs = require('fs');

async function debugSheets() {
  try {
    const serviceAccountPath = '/Users/suparit/Desktop/code/cc-financial/exalted-shape-473706-s4-b9396e7fb667.json';
    const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = '1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ';

    console.log('Fetching ALL rows from Monthly!AF:AR\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Monthly!AF:AR',
    });

    const rows = response.data.values;

    console.log(`Total rows: ${rows.length}\n`);

    console.log('=== ALL ROWS ===\n');
    rows.forEach((row, index) => {
      console.log(`Row ${index}: ${row[0]}`);
      if (row.length > 1) {
        console.log(`  Values: ${row.slice(1, 4).join(', ')}...`);
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSheets();