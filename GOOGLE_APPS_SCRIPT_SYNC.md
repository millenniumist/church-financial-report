# Google Apps Script Sync Setup

This guide explains how to set up automatic synchronization from Google Sheets to your database using Google Apps Script.

## 📋 Overview

Instead of using a server-side cron job, this application uses Google Apps Script triggers to sync financial data from your Google Sheet to your PostgreSQL database on a schedule.

**Benefits:**
- ✅ No need for a separate cron container
- ✅ Runs automatically on Google's infrastructure
- ✅ Can trigger sync immediately when data changes
- ✅ Easy to monitor and debug from Google Apps Script console
- ✅ Free with Google Workspace

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
/**
 * Financial Data Sync Script
 * Syncs data from Google Sheets to your database via REST API
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Your deployed application URL (use HTTPS in production)
  API_URL: 'https://millenniumist.dpdns.org/api/sync-financial',

  // Your sync API key (matches SYNC_API_KEY in .env)
  API_KEY: 'WctAqhyJ2AC1tLlYcFbV7O0q',

  // Request timeout in seconds
  TIMEOUT: 30
};
// =======================================================

/**
 * Adds a custom menu to the spreadsheet UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Sync Menu')
      .addItem('Sync Financial Data', 'syncFinancialData')
      .addSeparator()
      .addItem('Setup Auto-Sync (Every 6 hours)', 'setupAutoSync')
      .addItem('Setup Daily Sync (2 AM)', 'setupDailySync')
      .addItem('Setup On-Edit Sync', 'setupOnEditSync')
      .addSeparator()
      .addItem('List Triggers', 'listTriggers')
      .addItem('Remove All Triggers', 'removeAllTriggers')
      .addToUi();
}

/**
 * Main sync function - call this to sync financial data
 */
function syncFinancialData() {
  const startTime = new Date();

  try {
    Logger.log('🔄 Starting financial data sync...');

    const options = {
      method: 'post',
      headers: {
        'x-api-key': CONFIG.API_KEY,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CONFIG.API_URL, options);
    const statusCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    // Log the response
    Logger.log(`Response Status: ${statusCode}`);
    Logger.log(`Response: ${JSON.stringify(result, null, 2)}`);

    if (statusCode === 200 && result.success) {
      const duration = ((new Date() - startTime) / 1000).toFixed(2);
      Logger.log(`✅ Sync successful in ${duration}s`);
      Logger.log(`📊 Stats: Created=${result.created}, Updated=${result.updated}, Skipped=${result.skipped}`);

      // Optional: Send success notification email
      // sendNotificationEmail('Success', result);

      return result;
    } else {
      Logger.log(`❌ Sync failed: ${result.error || 'Unknown error'}`);

      // Optional: Send error notification email
      // sendNotificationEmail('Failed', result);

      throw new Error(result.error || `API returned status ${statusCode}`);
    }

  } catch (error) {
    const duration = ((new Date() - startTime) / 1000).toFixed(2);
    Logger.log(`❌ Error after ${duration}s: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);

    // Optional: Send error notification email
    // sendNotificationEmail('Error', { error: error.message });

    throw error;
  }
}

/**
 * Create a time-based trigger to run sync automatically
 */
function setupAutoSync() {
  // Delete existing triggers for this function to avoid duplicates
  deleteExistingTriggers('syncFinancialData');

  // Create a new trigger - runs every 6 hours
  ScriptApp.newTrigger('syncFinancialData')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('✅ Auto-sync trigger created: syncFinancialData will run every 6 hours');
}

/**
 * Create a trigger that runs once daily at a specific time
 */
function setupDailySync() {
  deleteExistingTriggers('syncFinancialData');

  // Run every day at 2 AM
  ScriptApp.newTrigger('syncFinancialData')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();

  Logger.log('✅ Daily sync trigger created: syncFinancialData will run at 2 AM every day');
}

/**
 * Create a trigger that runs when spreadsheet is edited
 * WARNING: This may trigger too frequently if the sheet is edited often
 */
function setupOnEditSync() {
  deleteExistingTriggers('onSpreadsheetEdit');

  ScriptApp.newTrigger('onSpreadsheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  Logger.log('✅ On-edit trigger created: Will sync when spreadsheet is edited');
}

/**
 * Handler for edit events (with debouncing)
 */
function onSpreadsheetEdit(e) {
  // Debounce: Only sync if last sync was more than 5 minutes ago
  const lastSyncTime = PropertiesService.getScriptProperties().getProperty('lastSyncTime');
  const now = new Date().getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (!lastSyncTime || (now - parseInt(lastSyncTime)) > fiveMinutes) {
    Logger.log('📝 Spreadsheet edited, triggering sync...');
    syncFinancialData();
    PropertiesService.getScriptProperties().setProperty('lastSyncTime', now.toString());
  } else {
    Logger.log('⏭️ Skipping sync (debounced - too soon since last sync)');
  }
}

/**
 * Delete all existing triggers for a specific function
 */
function deleteExistingTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    Logger.log(`🗑️ Deleted ${deletedCount} existing trigger(s) for ${functionName}`);
  }
}

/**
 * Remove all triggers
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log(`🗑️ Deleted ${triggers.length} trigger(s)`);
}

/**
 * List all active triggers
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    Logger.log('ℹ️ No active triggers');
    return;
  }

  Logger.log(`📋 Active Triggers (${triggers.length}):`);
  triggers.forEach((trigger, index) => {
    Logger.log(`${index + 1}. Function: ${trigger.getHandlerFunction()}`);
    Logger.log(`   Event: ${trigger.getEventType()}`);
    Logger.log(`   Source: ${trigger.getTriggerSource()}`);
  });
}

/**
 * Optional: Send email notification about sync status
 */
function sendNotificationEmail(status, result) {
  const email = Session.getActiveUser().getEmail();
  const subject = `Financial Data Sync ${status}`;

  let body = `Financial data sync ${status.toLowerCase()} at ${new Date().toLocaleString()}\n\n`;

  if (status === 'Success') {
    body += `Stats:\n`;
    body += `- Created: ${result.created}\n`;
    body += `- Updated: ${result.updated}\n`;
    body += `- Skipped: ${result.skipped}\n`;
    body += `- Total: ${result.total}\n`;
  } else {
    body += `Error: ${result.error || result.details || 'Unknown error'}\n`;
  }

  MailApp.sendEmail(email, subject, body);
}

/**
 * Test the API connection without syncing
 */
function testAPIConnection() {
  try {
    const response = UrlFetchApp.fetch(CONFIG.API_URL.replace('/api/sync-financial', '/api/health'));
    Logger.log(`✅ API is accessible: ${response.getContentText()}`);
  } catch (error) {
    Logger.log(`❌ Cannot reach API: ${error.message}`);
  }
}
```

### Step 4: Configure the Script

1. Update the `CONFIG` object at the top:
   - `API_URL`: Your deployed application URL (e.g., `https://your-domain.com/api/sync-financial`)
   - `API_KEY`: The same value as your `SYNC_API_KEY` environment variable

2. Save the script (Ctrl+S or Cmd+S)

### Step 5: Set Up Automatic Sync

Choose one of the following options:

#### Option A: Every 6 Hours (Recommended)

1. In the Apps Script editor, select the function `setupAutoSync` from the dropdown
2. Click **Run** (▶️)
3. Authorize the script when prompted
4. Check the logs - you should see "Auto-sync trigger created"

#### Option B: Daily at 2 AM

1. Select the function `setupDailySync` from the dropdown
2. Click **Run** (▶️)
3. Check the logs

#### Option C: On Every Edit (Advanced)

⚠️ **Warning:** This will sync every time the sheet is edited (debounced to max once per 5 minutes)

1. Select the function `setupOnEditSync` from the dropdown
2. Click **Run** (▶️)
3. Check the logs

### Step 6: Test the Setup

1. Select the function `syncFinancialData` from the dropdown
2. Click **Run** (▶️)
3. Check **Execution log** (View → Logs) to see the results
4. Verify data appears in your database

## 📊 Monitoring

### View Logs

- **Apps Script Logs**: View → Logs or View → Executions
- **API Logs**: Check your application logs via `docker compose logs`

### Check Trigger Status

Run the `listTriggers()` function to see all active triggers.

### Remove Triggers

Run the `removeAllTriggers()` function to delete all triggers.

## 🔧 Advanced Features

### Custom Schedule

Modify the trigger creation functions to use different schedules:

```javascript
// Every 3 hours
ScriptApp.newTrigger('syncFinancialData')
  .timeBased()
  .everyHours(3)
  .create();

// Every 30 minutes
ScriptApp.newTrigger('syncFinancialData')
  .timeBased()
  .everyMinutes(30)
  .create();

// Every Monday at 9 AM
ScriptApp.newTrigger('syncFinancialData')
  .timeBased()
  .onWeekDay(ScriptApp.WeekDay.MONDAY)
  .atHour(9)
  .create();
```

### Email Notifications

Uncomment the `sendNotificationEmail()` calls in the `syncFinancialData()` function to receive email notifications on sync success/failure.

### Manual Button in Sheet

1. Insert → Drawing → Create a button shape
2. Save and close the drawing
3. Click the drawing, then click the three dots → Assign script
4. Enter `syncFinancialData`
5. Click OK

Now you can click the button to trigger a sync manually!

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

### Trigger not running automatically

- Run `listTriggers()` to verify the trigger exists
- Check **View → Executions** to see trigger execution history
- Apps Script has a quota - check your quota usage

### Script execution quota exceeded

Google Apps Script has daily quotas:
- **Free accounts**: 90 minutes/day script runtime
- **Workspace accounts**: 6 hours/day script runtime

If exceeded, reduce sync frequency or optimize the script.

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Apps Script Triggers](https://developers.google.com/apps-script/guides/triggers)
- [Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)
