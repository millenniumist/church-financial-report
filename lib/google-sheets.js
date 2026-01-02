import { google } from 'googleapis';
import fs from 'fs';
import { logger } from './logger';

export async function getAuthClient() {
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

export async function fetchSheetData(sheetName, range = null, spreadsheetId = null) {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const fullRange = range ? `${sheetName}!${range}` : sheetName;

  logger.debug({ sheetName, range: fullRange, spreadsheetId: targetSpreadsheetId }, 'Fetching sheet data');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: targetSpreadsheetId,
    range: fullRange,
  });

  return response.data.values || [];
}

export function parseJSON(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (e) {
    logger.warn({ value, error: e.message }, 'Failed to parse JSON from sheet cell');
    return null;
  }
}

export function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
}

export function parseNumber(value, defaultValue = 0) {
  if (typeof value === 'number') return value;
  if (!value) return defaultValue;

  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? defaultValue : parsed;
}

export function createColumnMap(headers) {
  const colMap = {};
  headers.forEach((header, i) => {
    if (header) {
      colMap[header.toString().toLowerCase().trim()] = i;
    }
  });
  return colMap;
}
