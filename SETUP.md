# Church Financial Report - Setup Instructions

## Google Sheets API Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create API Credentials
Choose one of the following methods:

#### Option A: API Key (Simpler - for public sheets)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Make sure your Google Sheet is set to "Anyone with the link can view"

#### Option B: Service Account (More secure - recommended)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details and create
4. Click on the created service account
5. Go to "Keys" tab > "Add Key" > "Create new key" > "JSON"
6. Download the JSON file
7. Share your Google Sheet with the service account email (found in the JSON file)

### Step 3: Configure Environment Variables
1. Open `.env.local` in your project root
2. Add your API key:
   ```
   GOOGLE_SHEETS_API_KEY=your_actual_api_key_here
   GOOGLE_SHEETS_SPREADSHEET_ID=1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ
   ```

### Step 4: Make Sheet Accessible
- If using API Key: Set sheet permissions to "Anyone with the link can view"
- If using Service Account: Share the sheet with the service account email

## Running the Application

### Development Mode
```bash
npm run dev
```

Visit `http://localhost:3000` to view the financial report.

### Production Build
```bash
npm run build
npm start
```

## Google Sheet Structure

Your sheet should be structured with the following columns:
- Column A: Date
- Column B: Category (Income/Expense)
- Column C: Description
- Column D: Amount
- Column E: Notes (optional)

## Troubleshooting

### Error: "Failed to fetch financial data"
- Check that your API key is valid
- Verify the sheet ID is correct
- Ensure the sheet is shared properly
- Check that the Google Sheets API is enabled

### Data not showing correctly
- Verify your sheet structure matches the expected format
- Check that column B contains "income" or "expense" keywords
- Ensure amounts in column D are numbers

## Privacy Note

The application automatically:
- Aggregates all salary/staff expenses into "Office and Staff Expenses"
- Never displays individual salary amounts
- Only shows high-level category totals