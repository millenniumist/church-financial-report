# Deployment Instructions

## Deploy to Vercel

### Step 1: Login to Vercel
```bash
vercel login
```

### Step 2: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **cc-financial** (or your preferred name)
- In which directory is your code located? **./**
- Want to override the settings? **N**

### Step 3: Add Environment Variables

After the initial deployment, you need to add environment variables:

#### Option A: Using Vercel CLI
```bash
# Read the service account JSON and add it as an environment variable
vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production

# When prompted, paste the entire contents of privatekey-gsheet.json

# Add the spreadsheet ID
vercel env add GOOGLE_SHEETS_SPREADSHEET_ID production
# Enter: 1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add these variables:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: Copy entire contents of `privatekey-gsheet.json`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`: `1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ`

### Step 4: Update Code to Use JSON String

The code needs to be updated to read the service account from an environment variable instead of a file path (since files aren't uploaded to Vercel).

### Step 5: Redeploy
```bash
vercel --prod
```

## Important Notes

- **Never commit** `privatekey-gsheet.json` to git
- The `.gitignore` is already set up to ignore it
- Vercel will use environment variables instead of the file
- Make sure your Google Sheet is shared with the service account email