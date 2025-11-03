# Data Fields Reference

This document lists all data fields used in the Chonburi Church website application, organized by category.

## Table of Contents
- [Database Models](#database-models)
- [Financial Data](#financial-data)
- [Church Information](#church-information)
- [Ministry & Worship](#ministry--worship)
- [Projects](#projects)
- [Admin Settings](#admin-settings)

---

## Database Models

### FinancialRecord (Prisma Model)

| Field Name | Type | Required | Multiple Items | Description | Default Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `id` | String | Yes | No | Unique identifier | `cuid()` | Primary key |
| `date` | DateTime | Yes | No | Record date | - | Indexed for performance |
| `income` | Float | Yes | No | Total income amount | - | Numeric value |
| `expenses` | Float | Yes | No | Total expenses amount | - | Numeric value |
| `balance` | Float | Yes | No | Balance amount | - | Calculated field |
| `notes` | String | No | No | Additional notes | `null` | Optional field |
| `createdAt` | DateTime | Yes | No | Creation timestamp | `now()` | Auto-generated |
| `updatedAt` | DateTime | Yes | No | Last update timestamp | - | Auto-updated |

### FutureProject (Prisma Model)

| Field Name | Type | Required | Multiple Items | Description | Default Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `id` | String | Yes | No | Unique identifier | `cuid()` | Primary key |
| `name` | String | Yes | No | Project name | - | Display name |
| `description` | String | No | No | Project description | `null` | Optional details |
| `targetAmount` | Float | Yes | No | Target fundraising amount | - | Goal amount |
| `currentAmount` | Float | Yes | No | Current raised amount | `0` | Progress tracker |
| `priority` | Int | Yes | No | Display priority | `0` | Sort order (indexed) |
| `isActive` | Boolean | Yes | No | Active status | `true` | Visibility flag |
| `createdAt` | DateTime | Yes | No | Creation timestamp | `now()` | Auto-generated |
| `updatedAt` | DateTime | Yes | No | Last update timestamp | - | Auto-updated |

---

## Financial Data

### Financial Summary Data Structure

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `income` | Array | Yes | **Yes** | List of income categories | `[{category, amount}]` | Array of income items |
| `expenses` | Array | Yes | **Yes** | List of expense categories | `[{category, amount}]` | Array of expense items |
| `monthlyData` | Array | Yes | **Yes** | Monthly breakdown | `[{month, income, expense, balance}]` | 12 months of data |
| `year` | String/Number | Yes | No | Year of the data | `2025` | Display year |
| `totals` | Object | Yes | No | Summary totals | `{income, expenses, balance}` | Calculated totals |

### Income/Expense Item Structure

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `category` | String | Yes | No | Category name | `"ค่าบำรุงรักษา"` | Thai text |
| `amount` | Float | Yes | No | Amount value | `50000` | Numeric value |

### Monthly Data Item Structure

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `month` | String | Yes | No | Month name | `"ม.ค. 2025"` | Thai month format |
| `income` | Float | Yes | No | Monthly income | `100000` | Total for month |
| `expense` | Float | Yes | No | Monthly expense | `80000` | Total for month |
| `balance` | Float | Yes | No | Monthly balance | `20000` | income - expense |
| `date` | DateTime | No | No | Date reference | - | Optional field |
| `incomeDetails` | Array | No | **Yes** | Detailed income breakdown | `[{category, amount}]` | Per-category details |
| `expenseDetails` | Array | No | **Yes** | Detailed expense breakdown | `[{category, amount}]` | Per-category details |

---

## Church Information

### Contact Information (lib/contact-info.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `name` | String | Yes | No | Church name (Thai) | `"คริสตจักรชลบุรี"` | Display name |
| `nameEn` | String | Yes | No | Church name (English) | `"Chonburi Church"` | English version |
| `address.th` | String | Yes | No | Address in Thai | `"528/10 ถนนราษฎร์ประสงค์..."` | Full Thai address |
| `address.en` | String | Yes | No | Address in English | `"528/10 Ratsadornprasong Road..."` | Full English address |
| `phone` | String | Yes | No | Phone numbers | `"033-126-404, 080-566-4871"` | Multiple numbers allowed |
| `email` | String | Yes | No | Email address | `"chounburichurch.info@gmail.com"` | Contact email |
| `social.facebook` | String | Yes | No | Facebook page URL | `"https://www.facebook.com/ChonburiChurch"` | Social link |
| `social.facebookLive` | String | Yes | No | Facebook Live URL | `"https://www.facebook.com/ChonburiChurch/live/"` | Live stream link |
| `social.youtube` | String | Yes | No | YouTube channel URL | `"https://www.youtube.com/c/ChonburiChurch"` | YouTube link |
| `mapEmbedUrl` | String | Yes | No | Google Maps embed URL | `"https://www.google.com/maps/embed?pb=..."` | Embedded map |
| `coordinates.latitude` | Float | Yes | No | GPS latitude | `13.3644026` | Location coordinate |
| `coordinates.longitude` | Float | Yes | No | GPS longitude | `100.9818814` | Location coordinate |
| `worshipTimes` | Array | Yes | **Yes** | List of worship schedules | See below | Array of worship time objects |

### Worship Time Item Structure

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `day` | String | Yes | No | Day in Thai | `"วันอาทิตย์"` | Thai day name |
| `dayEn` | String | Yes | No | Day in English | `"Sunday"` | English day name |
| `time` | String | Yes | No | Time range | `"09:30 - 10:00"` | Time format |
| `event` | String | Yes | No | Event name (Thai) | `"ศึกษาพระคัมภีร์"` | Thai event name |
| `eventEn` | String | Yes | No | Event name (English) | `"Bible Study"` | English event name |

---

## Ministry & Worship

### Ministry Item Structure (Hard-coded in ministries/page.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `title` | String | Yes | No | Ministry name | `"กลุ่มครอบครัว"` | Display title |
| `schedule` | String | Yes | No | Meeting schedule | `"เดือนละ 1 ครั้ง • เสาร์ 16:00 น."` | Schedule description |
| `description` | String | Yes | No | Ministry description | `"กิจกรรมสำหรับครอบครัวคริสเตียน..."` | Full description |

**Note:** Ministries array currently supports **multiple items** (6 ministries defined)

### Beliefs Item Structure (Hard-coded in about/page.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `title` | String | Yes | No | Belief title | `"พระเจ้าตรีเอกานุภาพ"` | Title text |
| `description` | String | Yes | No | Belief description | `"เราเชื่อในพระเจ้าผู้เดียว..."` | Full description |
| `icon` | SVG | Yes | No | Icon markup | SVG path | Visual indicator |

**Note:** Beliefs currently support **multiple items** (4 beliefs defined)

---

## Projects

### Project Data Structure (from lib/sheets.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `name` | String | Yes | No | Project name | `"โครงการก่อสร้างอาคาร"` | Display name |
| `current` | Float | Yes | No | Current amount raised | `500000` | Fundraising progress |
| `goal` | Float | Yes | No | Target amount | `1000000` | Fundraising goal |
| `percentage` | Float | Yes | No | Progress percentage | `50` | Calculated: (current/goal)*100 |

**Note:** Projects are returned as an **array** supporting **multiple items**

---

## Admin Settings

### Admin Settings Structure (localStorage)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `incomeRows` | Array | Yes | **Yes** | Income category settings | See below | Array of income row objects |
| `expenseRows` | Array | Yes | **Yes** | Expense category settings | See below | Array of expense row objects |

### Category Row Structure (Income/Expense)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `id` | String | Yes | No | Category identifier | `"ค่าบำรุงรักษาคริสตจักร"` | Unique ID (category name) |
| `name` | String | Yes | No | Display name | `"ค่าบำรุงรักษาคริสตจักร"` | Category label |
| `visible` | Boolean | Yes | No | Visibility flag | `true` | Show/hide toggle |
| `aggregateInto` | String | No | No | Aggregate target category | `"ค่าใช้จ่ายทั่วไป"` | Group into another category |

**Note:** Both `incomeRows` and `expenseRows` support **multiple items**

---

## Navigation Items

### Navigation Item Structure (components/Navigation.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `name` | String | Yes | No | Display name | `"หน้าแรก"` | Thai text |
| `href` | String | Yes | No | Route path | `"/"` | Next.js route |

**Note:** Navigation items support **multiple items** (6 navigation links defined)

---

## Metadata / SEO

### SEO Metadata Structure (lib/seo.js)

| Field Name | Type | Required | Multiple Items | Description | Example Value | Notes |
|------------|------|----------|----------------|-------------|---------------|-------|
| `title` | String | Yes | No | Page title | `"การเงิน"` | SEO title |
| `description` | String | Yes | No | Page description | `"รายงานการเงินและความโปร่งใส..."` | Meta description |
| `path` | String | Yes | No | URL path | `"/financial"` | Route path |
| `keywords` | Array | No | **Yes** | SEO keywords | `["การเงิน", "รายรับรายจ่าย"]` | Search keywords |

---

## Summary: Fields That Allow Multiple Items

| Data Structure | Field Name | Item Type | Max Items | Notes |
|----------------|------------|-----------|-----------|-------|
| Financial Summary | `income` | Income Item | Unlimited | Category-based income |
| Financial Summary | `expenses` | Expense Item | Unlimited | Category-based expenses |
| Financial Summary | `monthlyData` | Monthly Item | 12 | One per month |
| Monthly Data | `incomeDetails` | Category Detail | Unlimited | Per-category breakdown |
| Monthly Data | `expenseDetails` | Category Detail | Unlimited | Per-category breakdown |
| Contact Info | `worshipTimes` | Worship Time | Unlimited | Worship schedules |
| Projects | `projects` | Project | Unlimited | Future projects |
| Admin Settings | `incomeRows` | Category Row | Unlimited | Income categories |
| Admin Settings | `expenseRows` | Category Row | Unlimited | Expense categories |
| Navigation | `navItems` | Nav Item | Unlimited | Menu items |
| Ministries | `ministries` | Ministry | Unlimited | Church ministries |
| About/Beliefs | `beliefs` | Belief | Unlimited | Church beliefs |
| SEO Metadata | `keywords` | String | Unlimited | SEO keywords |

---

## Notes

1. **Hard-coded vs Dynamic Data:**
   - Contact info, ministries, and beliefs are currently hard-coded in their respective page files
   - Financial data comes from Google Sheets API
   - Projects can come from database (FutureProject model) or Google Sheets
   - Admin settings are stored in browser localStorage

2. **Data Sources:**
   - **Database (PostgreSQL via Prisma):** FinancialRecord, FutureProject
   - **Google Sheets:** Financial data, categories, projects
   - **localStorage:** Admin settings (category visibility/aggregation)
   - **Hard-coded:** Contact info, navigation, ministries, beliefs

3. **Expandable Arrays:**
   - All arrays marked as "Multiple Items: Yes" can have unlimited entries added
   - Arrays are typically rendered using `.map()` in React components
   - No hard limits exist in the data structures

4. **Internationalization:**
   - Many fields have both Thai (default) and English versions
   - English fields typically end with `En` suffix
   - Thai is the primary language used throughout the site
