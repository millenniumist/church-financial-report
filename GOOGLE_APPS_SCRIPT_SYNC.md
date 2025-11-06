# Google Apps Script Sync Setup

This guide explains how to set up automatic synchronization from Google Sheets to your database using Google Apps Script. The public site now reads exclusively from the PostgreSQL database; Google Sheets is used solely as an optional back-office tool for entering and staging **financial** data before it is pushed into the database. All other content (missions, projects, navigation, etc.) is managed in the Admin Backoffice.

## 📋 Overview

Instead of using a server-side cron job, this application uses Google Apps Script triggers to sync data from your Google Sheet to your PostgreSQL database on a schedule.

**Benefits of this approach:**
- ✅ Website and APIs always read from PostgreSQL (no runtime Google API calls)
- ✅ Google Sheets remains a friendly data-entry surface for staff
- ✅ Sync can run automatically on Google's infrastructure or on demand
- ✅ Easy to monitor and debug from Google Apps Script console
- ✅ Avoids maintaining a separate cron container
- ✅ **All data parsing happens server-side** for consistency and maintainability
- ✅ **Simple Apps Script** - just triggers endpoints, no business logic

**Architecture:**
1. Google Apps Script triggers sync endpoints (simple HTTP POST calls)
2. Next.js server fetches data directly from Google Sheets API
3. Server parses and validates all data
4. Server updates PostgreSQL database
5. Public APIs read from PostgreSQL only

## 🚀 Setup Instructions

### Step 1: Prepare Your Environment

1. Make sure your Next.js application is deployed and accessible via HTTPS
2. Set the `SYNC_API_KEY` environment variable in your `.env`:

```bash
SYNC_API_KEY="your-strong-random-api-key-here"
```

> **Generate a secure API key:**
> ```bash
> openssl rand -hex 32
> ```

### Step 2: Open Google Apps Script

1. Open your Google Sheets financial document
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the script editor

### Step 3: Add the Sync Script

Paste the following code into the Apps Script editor:

```javascript
// ==================== CONFIGURATION ====================
const CONFIG = {
  // Your deployed application base URL (use HTTPS in production)
  BASE_URL: 'https://millenniumist.dpdns.org',

  // Your sync API key (matches SYNC_API_KEY in .env)
  API_KEY: 'WctAqhyJ2AC1tLlYcFbV7O0q',

  // Request timeout in seconds
  TIMEOUT: 30
};
// =======================================================

/**
 * Adds custom menus to the spreadsheet UI.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📊 Financial Sync')
      .addItem('📈 Sync Financial Data', 'syncFinancialData')
      .addToUi();
}

/**
 * Generic sync function to call any endpoint
 * Note: All data parsing is now done server-side for consistency and maintainability
 */
function callSyncAPI(endpoint, syncName) {
  const startTime = new Date();

  try {
    Logger.log(`🔄 Starting ${syncName} sync...`);

    const options = {
      method: 'post',
      headers: {
        'x-api-key': CONFIG.API_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({}),
      muteHttpExceptions: true
    };

    const url = `${CONFIG.BASE_URL}${endpoint}`;
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`Raw API Response (${statusCode}): ${responseText}`);

    let result = {};
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      Logger.log(`❌ Failed to parse API response as JSON: ${e.message}`);
      throw new Error(`Invalid JSON response from API. Status: ${statusCode}, Response: ${responseText}`);
    }

    Logger.log(`Parsed Response: ${JSON.stringify(result, null, 2)}`);

    if (statusCode === 200 && result.success) {
      const duration = ((new Date() - startTime) / 1000).toFixed(2);
      Logger.log(`✅ ${syncName} sync successful in ${duration}s`);

      // Log any created/updated/skipped counts
      if (result.created !== undefined) {
        Logger.log(`Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
      }

      return result;
    } else {
      Logger.log(`❌ ${syncName} sync failed: ${result.error || `API returned status ${statusCode}`}`);
      throw new Error(result.error || `API returned status ${statusCode}. Full response: ${responseText}`);
    }

  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    Logger.log(`❌ Error after ${duration}s: ${error.message}`);
    throw error;
  }
}

/**
 * Sync Financial Data from Monthly sheet
 * Server fetches and parses data from Google Sheets
 */
function syncFinancialData() {
  return callSyncAPI('/api/sync-financial', 'Financial Data');
}

/**
 * Sync Missions from Mission sheet
 * Server fetches and parses data from Google Sheets
 */
// All non-financial content is now maintained exclusively via the Admin Backoffice.

```

### Data stored in the database

The sync operations populate the following database tables:

#### 1. Financial Records (`syncFinancialData`)
Creates/updates monthly `FinancialRecord` rows from the **Monthly** sheet:
- `income`, `expenses`, `balance`, and `notes`
- `incomeDetails` / `expenseDetails`: arrays of `{ id, label, amount }` for every category in the sheet
- **Automatically processes all available months** from your sheet (not limited to 12 months)
- Extracts year from month header (e.g., "มกราคม 2025", "January 2026")

#### 2. Financial Categories (`syncFinancialData`)
Creates/updates categories in `FinancialCategory` table from the **Monthly** sheet:
- Extracts all income and expense category names from column AF
- Stores them with their order, visibility settings, and type (income/expense)
- Categories are used for filtering, aggregation, and display customization

> ℹ️ **Admin-managed content**  
> Missions, future projects, contact information, navigation, and reusable page sections now live in the Admin Backoffice. Those sync endpoints have been removed—sheets are no longer the source of truth for that data.

### Google Sheets Structure

Your sheet should follow this structure:

```
Column AF: Category names (ค่าถวาย, ค่าไฟฟ้า, etc.)
Column AG: มกราคม 2025 (January 2025)
Column AH: กุมภาพันธ์ 2025 (February 2025)
...
Column AR: ธันวาคม 2025 (December 2025)
Column AS: มกราคม 2026 (January 2026)  ← Future years
Column AT: กุมภาพันธ์ 2026 (February 2026)
...
```

**Important**: The month header MUST include the year (e.g., "มกราคม 2025" not just "มกราคม") so the sync can correctly identify which year each column belongs to.

### Expanding for Future Years

When you need to add data for 2026 and beyond:

1. **In Google Sheets**: Simply add more columns after AR (AS, AT, AU, etc.)
2. **In your sync code**: Update the range if needed

**Option 1: Automatic (Recommended)**
The sync already fetches `AF:AZ` (20 columns) by default, which handles:
- 2025: 12 months (AG-AR)
- 2026: 8 months (AS-AZ)

**Option 2: Expand the Range**
If you need more years, update the range in your code:

```javascript
// In app/api/sync-financial/route.js line 26
async function fetchSheetsData(range = 'Monthly!AF:BZ') {  // AF:BZ = 50 columns
  // This handles ~4 years of data
}
```

Or fetch everything:
```javascript
async function fetchSheetsData(range = 'Monthly!AF:ZZ') {  // Fetch all columns
  // Processes all available data
}
```

The sync will automatically:
- Read all columns with data
- Extract the year from each month header
- Create/update records for any year
- Handle 2025, 2026, 2027, etc. without code changes

### Managing Categories

After syncing, you can manage category visibility and aggregation through the admin panel on your financial page:

**Category Settings:**
- **Visibility**: Toggle categories on/off to show/hide them in reports
- **Aggregation**: Combine multiple categories into one for simplified reporting
- **Order**: Categories maintain the order from your Google Sheet (column AF)

**How it works:**
1. Sync extracts category names from Google Sheets column AF
2. Categories are stored in the database with default visibility = true
3. Admin users can modify visibility and aggregation settings
4. Settings persist across syncs (only category names/order update)
5. The `/api/financial-data` endpoint respects these settings when returning data

### Step 4: Configure the Script

1. Update the `CONFIG` object at the top:
   - `API_URL`: Your deployed application URL (e.g., `https://millenniumist.dpdns.org/api/sync-financial`)
   - `API_KEY`: The same value as your `SYNC_API_KEY` environment variable

2. Save the script (Ctrl+S or Cmd+S)

### Step 5: Test the Setup

**Option 1: Run from Menu (Recommended)**
1. Go back to your Google Sheet
2. Reload the page to trigger `onOpen()`
3. You should see a new menu: **📊 Financial Sync**
4. Click **📊 Financial Sync** → **📈 Sync Financial Data**
5. Check **Execution log** to see results

**Option 2: Run from Script Editor**
1. In the Apps Script editor, select `syncFinancialData` from dropdown
2. Click **Run** (▶️)
3. Authorize the script when prompted
4. Check **Execution log** (View → Logs)

**Verify:**
- Check logs for "✅ Sync successful"
- Verify data in your database

## 📊 Monitoring

### View Logs

- **Apps Script Logs**: View → Logs or View → Executions
- **API Logs**: Check your application logs via `docker compose logs`

### Manual Sync

To manually sync data:
1. Open your Google Sheet
2. Click **📊 Financial Sync** → **📈 Sync Financial Data**
3. Wait for success notification in logs

## 🔧 Advanced: Add Sync Button to Sheet

If you want a button directly in your sheet:

1. In your Google Sheet, click **Insert** → **Drawing**
2. Create a button (rectangle with text "Sync to Database")
3. Save and close the drawing
4. Click the drawing → Three dots → **Assign script**
5. Enter `syncFinancialData`
6. Click **OK**

Now you can click the button to sync without using the menu!

## 🐛 Troubleshooting

### "Unauthorized" Error (401)

- Verify `API_KEY` in the script matches `SYNC_API_KEY` in your environment
- Check that the environment variable is properly loaded in your deployment

### "API not reachable" Error

- Verify your application is running and accessible via HTTPS
- Test the URL in your browser: `https://millenniumist.dpdns.org/api/health`
- Check firewall settings

### "Permission denied" when running

- Click **Review Permissions** when prompted
- Select your Google account
- Click **Advanced** → **Go to [Your Script Name] (unsafe)**
- Click **Allow**

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Apps Script Triggers](https://developers.google.com/apps-script/guides/triggers)
- [Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)
