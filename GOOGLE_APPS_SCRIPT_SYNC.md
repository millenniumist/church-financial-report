# Google Apps Script Sync Setup

This guide explains how to set up automatic synchronization from Google Sheets to your database using Google Apps Script. The public site now reads exclusively from the PostgreSQL database; Google Sheets is only used as an optional back-office tool for entering and staging data before it is pushed into the database.

## 📋 Overview

Instead of using a server-side cron job, this application uses Google Apps Script triggers to sync financial data from your Google Sheet to your PostgreSQL database on a schedule.

**Benefits of this approach:**
- ✅ Website and APIs always read from PostgreSQL (no runtime Google API calls)
- ✅ Google Sheets remains a friendly data-entry surface for staff
- ✅ Sync can run automatically on Google's infrastructure or on demand
- ✅ Easy to monitor and debug from Google Apps Script console
- ✅ Avoids maintaining a separate cron container

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

  ui.createMenu('🔄 Sync Content')
      .addItem('📊 Sync Financial Data', 'syncFinancialData')
      .addSeparator()
      .addItem('🎯 Sync Missions', 'syncMissions')
      .addItem('📞 Sync Contact Info', 'syncContactInfo')
      .addItem('🧭 Sync Navigation', 'syncNavigation')
      .addItem('📄 Sync Page Content', 'syncPageContent')
      .addItem('🏗️ Sync Future Projects', 'syncProjects')
      .addSeparator()
      .addItem('🔄 Sync All Content', 'syncAllContent')
      .addToUi();
}

/**
 * Generic sync function to call any endpoint
 */
function callSyncAPI(endpoint, payload, syncName) {
  const startTime = new Date();
  let result = {};

  try {
    Logger.log(`🔄 Starting ${syncName} sync...`);

    const options = {
      method: 'post',
      headers: {
        'x-api-key': CONFIG.API_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const url = `${CONFIG.BASE_URL}${endpoint}`;
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`Raw API Response (${statusCode}): ${responseText}`);

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
 */
function syncFinancialData() {
  return callSyncAPI('/api/sync-financial', {}, 'Financial Data');
}

/**
 * Sync Missions from Mission sheet
 */
function syncMissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Mission');
  if (!sheet) {
    throw new Error('Mission sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const missions = [];

  // Find column indices
  const colMap = {};
  headers.forEach((header, i) => {
    colMap[header.toString().toLowerCase()] = i;
  });

  // Parse rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap['slug']]) continue; // Skip if no slug

    const mission = {
      slug: row[colMap['slug']],
      title: parseJSON(row[colMap['title']]) || { th: '', en: '' },
      theme: parseJSON(row[colMap['theme']]) || { th: '', en: '' },
      summary: parseJSON(row[colMap['summary']]) || { th: '', en: '' },
      description: parseJSON(row[colMap['description']]) || { th: '', en: '' },
      focusAreas: parseJSON(row[colMap['focusareas']]) || { th: [], en: [] },
      scripture: parseJSON(row[colMap['scripture']]) || null,
      nextSteps: parseJSON(row[colMap['nextsteps']]) || { th: [], en: [] },
      pinned: row[colMap['pinned']] === true || row[colMap['pinned']] === 'TRUE',
      heroImageUrl: row[colMap['heroimageurl']] || null,
      startDate: row[colMap['startdate']] ? new Date(row[colMap['startdate']]).toISOString() : null,
      endDate: row[colMap['enddate']] ? new Date(row[colMap['enddate']]).toISOString() : null
    };

    missions.push(mission);
  }

  return callSyncAPI('/api/sync-content/missions', { missions }, 'Missions');
}

/**
 * Sync Contact Info from ContactInfo sheet
 */
function syncContactInfo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ContactInfo');
  if (!sheet) {
    throw new Error('ContactInfo sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (data.length < 2) {
    throw new Error('ContactInfo sheet has no data');
  }

  const row = data[1]; // Single row table
  const colMap = {};
  headers.forEach((header, i) => {
    colMap[header.toString().toLowerCase()] = i;
  });

  const contact = {
    name: parseJSON(row[colMap['name']]) || { th: '', en: '' },
    phone: row[colMap['phone']] || '',
    email: row[colMap['email']] || '',
    address: parseJSON(row[colMap['address']]) || { th: '', en: '' },
    social: parseJSON(row[colMap['social']]) || {},
    mapEmbedUrl: row[colMap['mapembedurl']] || null,
    coordinates: parseJSON(row[colMap['coordinates']]) || {},
    worshipTimes: parseJSON(row[colMap['worshiptimes']]) || []
  };

  return callSyncAPI('/api/sync-content/contact', { contact }, 'Contact Info');
}

/**
 * Sync Navigation Items from NavigationItem sheet
 */
function syncNavigation() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NavigationItem');
  if (!sheet) {
    throw new Error('NavigationItem sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const navigationItems = [];

  const colMap = {};
  headers.forEach((header, i) => {
    colMap[header.toString().toLowerCase()] = i;
  });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap['href']]) continue;

    const item = {
      href: row[colMap['href']],
      label: parseJSON(row[colMap['label']]) || { th: '', en: '' },
      order: Number(row[colMap['order']]) || 0,
      active: row[colMap['active']] === true || row[colMap['active']] === 'TRUE'
    };

    navigationItems.push(item);
  }

  return callSyncAPI('/api/sync-content/navigation', { navigationItems }, 'Navigation');
}

/**
 * Sync Page Content from PageContent sheet
 */
function syncPageContent() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PageContent');
  if (!sheet) {
    throw new Error('PageContent sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const pageContents = [];

  const colMap = {};
  headers.forEach((header, i) => {
    colMap[header.toString().toLowerCase()] = i;
  });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap['page']] || !row[colMap['section']]) continue;

    const content = {
      page: row[colMap['page']],
      section: row[colMap['section']],
      title: parseJSON(row[colMap['title']]) || null,
      subtitle: parseJSON(row[colMap['subtitle']]) || null,
      description: parseJSON(row[colMap['description']]) || null,
      body: parseJSON(row[colMap['body']]) || null,
      metadata: parseJSON(row[colMap['metadata']]) || null
    };

    pageContents.push(content);
  }

  return callSyncAPI('/api/sync-content/pages', { pageContents }, 'Page Content');
}

/**
 * Sync Future Projects from FutureProject sheet
 */
function syncProjects() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FutureProject');
  if (!sheet) {
    throw new Error('FutureProject sheet not found');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const projects = [];

  const colMap = {};
  headers.forEach((header, i) => {
    colMap[header.toString().toLowerCase()] = i;
  });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colMap['name']]) continue;

    const project = {
      id: row[colMap['id']] || null,
      name: row[colMap['name']],
      description: row[colMap['description']] || null,
      targetAmount: Number(row[colMap['targetamount']]) || 0,
      currentAmount: Number(row[colMap['currentamount']]) || 0,
      priority: Number(row[colMap['priority']]) || 0,
      isActive: row[colMap['isactive']] === true || row[colMap['isactive']] === 'TRUE'
    };

    projects.push(project);
  }

  return callSyncAPI('/api/sync-content/projects', { projects }, 'Future Projects');
}

/**
 * Sync all content types
 */
function syncAllContent() {
  Logger.log('🔄 Starting sync for all content types...');

  const results = {
    financial: null,
    missions: null,
    contact: null,
    navigation: null,
    pages: null,
    projects: null
  };

  try {
    results.financial = syncFinancialData();
  } catch (e) {
    Logger.log(`❌ Financial sync failed: ${e.message}`);
  }

  try {
    results.missions = syncMissions();
  } catch (e) {
    Logger.log(`❌ Missions sync failed: ${e.message}`);
  }

  try {
    results.contact = syncContactInfo();
  } catch (e) {
    Logger.log(`❌ Contact sync failed: ${e.message}`);
  }

  try {
    results.navigation = syncNavigation();
  } catch (e) {
    Logger.log(`❌ Navigation sync failed: ${e.message}`);
  }

  try {
    results.pages = syncPageContent();
  } catch (e) {
    Logger.log(`❌ Page content sync failed: ${e.message}`);
  }

  try {
    results.projects = syncProjects();
  } catch (e) {
    Logger.log(`❌ Projects sync failed: ${e.message}`);
  }

  Logger.log('✅ All sync operations completed');
  Logger.log(`Results: ${JSON.stringify(results, null, 2)}`);

  return results;
}

/**
 * Helper function to parse JSON strings
 */
function parseJSON(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

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

#### 3. Missions (`syncMissions`)
Creates/updates `Mission` records from the **Mission** sheet:
- `slug` (unique identifier), `title`, `theme`, `summary`, `description`
- `focusAreas`, `scripture`, `nextSteps` (multilingual JSON fields)
- `pinned`, `heroImageUrl`, `startDate`, `endDate`

#### 4. Contact Info (`syncContactInfo`)
Creates/updates a single `ContactInfo` record (ID=1) from the **ContactInfo** sheet:
- `name`, `phone`, `email`, `address` (multilingual)
- `social` (JSON with social media links)
- `mapEmbedUrl`, `coordinates`, `worshipTimes`

#### 5. Navigation Items (`syncNavigation`)
Creates/updates `NavigationItem` records from the **NavigationItem** sheet:
- `href` (used for identification), `label` (multilingual)
- `order`, `active` (boolean)

#### 6. Page Content (`syncPageContent`)
Creates/updates `PageContent` records from the **PageContent** sheet:
- `page` + `section` (composite unique key)
- `title`, `subtitle`, `description`, `body` (multilingual JSON fields)
- `metadata` (additional JSON data)

#### 7. Future Projects (`syncProjects`)
Creates/updates `FutureProject` records from the **FutureProject** sheet:
- `id` (optional), `name`, `description`
- `targetAmount`, `currentAmount`, `priority`
- `isActive` (boolean)

The public APIs read exclusively from the PostgreSQL database, eliminating runtime Google Sheets API calls.

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
   - `API_URL`: Your deployed application URL (e.g., `https://your-domain.com/api/sync-financial`)
   - `API_KEY`: The same value as your `SYNC_API_KEY` environment variable

2. Save the script (Ctrl+S or Cmd+S)

### Step 5: Test the Setup

**Option 1: Run from Menu (Recommended)**
1. Go back to your Google Sheet
2. Reload the page to trigger `onOpen()`
3. You should see a new menu: **📊 Financial**
4. Click **📊 Financial** → **Sync to Database**
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
2. Click **📊 Financial** → **Sync to Database**
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
- Test the URL in your browser: `https://your-domain.com/api/health`
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
