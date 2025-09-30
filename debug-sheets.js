const { google } = require('googleapis');
const fs = require('fs');

async function debugSheets() {
  try {
    // Load service account credentials
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || '/Users/suparit/Desktop/code/cc-financial/exalted-shape-473706-s4-b9396e7fb667.json';
    console.log('Loading credentials from:', serviceAccountPath);

    const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('Service account email:', credentials.client_email);

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = '1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ';

    console.log('\nFetching data from spreadsheet:', spreadsheetId);
    console.log('Range: Monthly!AF:AR\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Monthly!AF:AR',
    });

    const rows = response.data.values;

    console.log('Total rows fetched:', rows ? rows.length : 0);

    if (rows && rows.length > 0) {
      console.log('\n=== First 5 rows ===');
      rows.slice(0, 5).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
      });

      console.log('\n=== Column count in first row ===');
      console.log('Columns:', rows[0].length);

      console.log('\n=== Sample data structure ===');
      rows.slice(1, 6).forEach((row, index) => {
        console.log(`\nData row ${index + 1}:`);
        console.log('  Column AF (0):', row[0]);
        console.log('  Column AG (1):', row[1]);
        console.log('  Column AH (2):', row[2]);
        console.log('  Column AI (3):', row[3]);
        console.log('  Full row:', row);
      });
    } else {
      console.log('No data found!');
      console.log('\nPossible issues:');
      console.log('1. Sheet "Monthly" does not exist');
      console.log('2. Range AF:AR is empty');
      console.log('3. Service account does not have access to the sheet');
      console.log('\nMake sure you shared the sheet with:', credentials.client_email);
    }

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  }
}

debugSheets();