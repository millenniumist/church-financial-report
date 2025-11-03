# Docker Deployment Guide

Self-host this project with Docker.

## 📋 Overview

This stack includes:
- **Next.js application** (`nextjs-app` service)
- **Prisma** client bundled into the app container; connect it to any PostgreSQL-compatible database
- **Sync API** endpoint (`/api/sync-financial`) that can be called from Google Apps Script to sync financial data on-demand

## 🚀 Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Fill in DATABASE_URL, GOOGLE_SHEETS_SPREADSHEET_ID, credentials, etc.
```

You can keep using `.env`, or create another file (for example, `.env.production`) and pass it as the first argument to `deploy.sh`.

### 2. Build & Run

```bash
# From the repository root
 ./deploy.sh               # or ./deploy.sh .env.production
```

To deploy over SSH instead of locally:

```bash
./deploy.sh --remote user@your-host:/srv/cc-financial
```

The script creates a single SSH control connection, so you only enter your password once. It then syncs the project, runs `docker compose up -d --build`, and shows container status on the target host.

If port 3000 is already in use locally, the script will tell you which processes or containers occupy it and ask whether to stop them before continuing.
If `.env` is absent, the script automatically falls back to `.env.local`, verifies that `DATABASE_URL` and `GOOGLE_SHEETS_SPREADSHEET_ID` exist, and drops a `.env` symlink so follow-up commands like `docker compose logs -f` pick up the same credentials.

### 3. Verify Deployment

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/sync-financial
curl http://localhost:3000/api/financial
```

## 🔄 Syncing Financial Data

Instead of using a cron job, this application provides a REST API endpoint that can be called from Google Apps Script to sync data on-demand.

### Setting up Google Apps Script Trigger

1. Open your Google Sheets document
2. Go to **Extensions** → **Apps Script**
3. Create a new script with the following code:

```javascript
// Configuration
const API_URL = 'https://your-domain.com/api/sync-financial';
const API_KEY = 'your-sync-api-key'; // Set this in your .env as SYNC_API_KEY

function syncFinancialData() {
  try {
    const options = {
      method: 'post',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(API_URL, options);
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      Logger.log(`✅ Sync successful: ${result.message}`);
      Logger.log(`Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
    } else {
      Logger.log(`❌ Sync failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    Logger.log(`❌ Error syncing: ${error.message}`);
    throw error;
  }
}

// Optional: Set up a time-based trigger
function createTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncFinancialData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create a new trigger - runs every 6 hours
  ScriptApp.newTrigger('syncFinancialData')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('✅ Trigger created: syncFinancialData will run every 6 hours');
}
```

4. Run `createTrigger()` once to set up automatic syncing every 6 hours
5. Or run `syncFinancialData()` manually whenever you want to sync

### Alternative: Manual Trigger Button in Sheets

You can also add a button in your Google Sheet to trigger the sync:

1. Insert a drawing or shape in your sheet
2. Right-click it and select **Assign script**
3. Enter `syncFinancialData` as the function name

Now clicking the button will sync the data to your database.

### Testing the Sync Endpoint

Test the API directly with curl:

```bash
# With API key
curl -X POST http://localhost:3000/api/sync-financial \
  -H "x-api-key: your-sync-api-key"

# Or with Bearer token
curl -X POST http://localhost:3000/api/sync-financial \
  -H "Authorization: Bearer your-sync-api-key"
```

Response example:
```json
{
  "success": true,
  "message": "Synced 12 financial records",
  "created": 0,
  "updated": 2,
  "skipped": 10,
  "total": 12,
  "timestamp": "2025-10-31T10:30:00.000Z"
}
```

## 🔧 Maintenance

```bash
# Tail all logs
docker compose logs -f

# Tail only the app
docker compose logs -f nextjs-app

# Restart services
docker compose restart nextjs-app

# Stop everything
docker compose down
```

When deploying remotely, run the same commands through SSH, for example:

```bash
ssh user@host "cd /srv/cc-financial && docker compose logs -f"
```

## 🔄 Updating the App

```bash
git pull                # or merge your changes locally
./deploy.sh             # rebuilds and restarts containers
```

If you changed environment variables, update your `.env` (or whichever file you pass to the script) before re-running the deploy.

## 🐛 Troubleshooting

- **Database connection errors**
  ```bash
  docker exec cc-financial-app env | grep DATABASE_URL
  curl http://localhost:3000/api/health
  ```

- **Google Sheets issues**
  ```bash
  docker exec cc-financial-app ls -la /app/privatekey-gsheet.json
  docker exec cc-financial-app env | grep GOOGLE_SHEETS_SPREADSHEET_ID
  curl http://localhost:3000/api/sync-financial -H "x-api-key: your-key"
  ```

- **Sync API returns 401 Unauthorized**
  - Check that `SYNC_API_KEY` is set in your `.env` file
  - Verify the API key matches in both your environment and Google Apps Script

- **Containers crash on start**
  ```bash
  docker compose logs
  docker compose down
  docker compose up -d --build
  df -h                          # ensure there is disk space
  ```

For remote deployments, wrap the commands in `ssh user@host "..."`.

## 📦 Relevant Files

```
Dockerfile             # multi-stage build for the Next.js app
docker-compose.yml     # app service configuration
app/api/sync-financial/route.js  # Sync endpoint implementation
```

## 🔐 Security Notes

- **API Key Protection**: Set `SYNC_API_KEY` in your environment to protect the sync endpoint
- If `SYNC_API_KEY` is not set, the API will work without authentication (not recommended for production)
- Use HTTPS in production to protect the API key in transit
- Consider using Vercel's environment variable encryption for sensitive values
