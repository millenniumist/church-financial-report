# Church Financial Report - Requirements Document

## Project Overview
A simple Next.js web application to display church financial reports from Google Sheets.

## Technical Stack
- **Framework**: Next.js (App Router)
- **Language**: JavaScript (no TypeScript)
- **Data Source**: Google Sheets
- **Sheet URL**: https://docs.google.com/spreadsheets/d/1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ/edit?gid=1746689457#gid=1746689457
- **Sheet ID**: 1jfq_i48y9ToUE4CeHt43EMP5fePmv7EyPDnbasCwzpQ
- **Deployment**: TBD

## Core Requirements

### 1. Google Sheets Integration
- Connect to a Google Sheet containing church financial data
- Read financial data from the sheet
- Use Google Sheets API for data fetching

### 2. Financial Report Display
- Display financial data in a clean, readable format
- Show income and expenses at HIGH LEVEL categories only
- Combine detailed salary/compensation data into single "Office and Staff Expenses" line item
- DO NOT display individual salary amounts or names
- Basic table or card-based layout

### 3. User Interface
- Simple, clean design
- Mobile-responsive layout
- Easy navigation
- Print-friendly view (optional)

## Data Structure (From Google Sheet)

### Data Processing Rules:
- Read raw financial data from Google Sheet
- Aggregate salary/compensation entries into single category
- Group expenses into high-level categories:
  - Office and Staff Expenses (salaries, benefits, office supplies combined)
  - Utilities
  - Facilities/Maintenance
  - Ministry/Programs
  - Other Operating Expenses
- Group income into categories:
  - Tithes/Offerings
  - Donations
  - Other Income

## Features

### Must Have:
- [ ] Display current month's financial summary
- [ ] Show income vs expenses
- [ ] Calculate total balance
- [ ] Responsive design for mobile and desktop

### Nice to Have:
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Export to PDF
- [ ] Search functionality
- [ ] Chart/graph visualization

## Authentication & Access
- Public view or password-protected (to be decided)
- Google Sheets permissions set to allow API access

## Setup Requirements

### Google Cloud Console:
1. Create a new project
2. Enable Google Sheets API
3. Create credentials (API Key or Service Account)
4. Share Google Sheet with service account email (if using service account)

### Environment Variables:
- Google Sheets API credentials
- Sheet ID
- Any other configuration values

## Non-Functional Requirements
- Fast page load times
- Secure API key handling
- Error handling for API failures
- Clear error messages for users

## Privacy & Data Protection
- **CRITICAL**: Never display individual salary amounts
- **CRITICAL**: Never display employee names with compensation
- Aggregate all salary/personnel costs into single summary line
- Only show high-level financial categories suitable for congregation viewing

## Out of Scope (For Initial Version)
- User authentication system
- Data editing capabilities
- Multiple church support
- Historical data analysis
- Budget planning features

## Success Criteria
- Successfully fetch and display data from Google Sheets
- Clean, readable financial report
- Works on mobile and desktop browsers
- Page loads within 3 seconds

## Timeline
TBD

## Notes
- Keep the implementation simple and straightforward
- Focus on core functionality first
- Can expand features based on feedback