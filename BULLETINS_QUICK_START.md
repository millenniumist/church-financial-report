# 📄 Bulletins Feature - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Setup Remote Server
```bash
./scripts/setup-bulletins-feature.sh
```
This creates the bulletins directory and runs database migration.

### Step 2: Deploy Code
```bash
./deployment/deploy-remote.sh
```
This deploys all the new code to your server.

### Step 3: Start Using!
1. Visit: https://millenniumist.dpdns.org/admin/bulletins
2. Click "อัพโหลดสูจิบัตรใหม่ / Upload New Bulletin"
3. Select a Sunday date
4. Upload a PDF file
5. Done! 🎉

---

## 📋 Quick Reference

### Admin URLs
- **List Bulletins**: `/admin/bulletins`
- **Upload New**: `/admin/bulletins/new`

### Public URLs
- **View All**: `/bulletins`
- **Direct PDF**: `/api/bulletins/[id]`

### Storage Locations
- **Local**: `/home/mill/hosting/bulletins/` (Primary)
- **Cloudinary**: `church-cms/bulletins/` (Backup)

---

## 🎯 Features

✅ **Sunday-only date picker** - Prevents selecting weekdays  
✅ **PDF validation** - Only PDF files, max 10MB  
✅ **Dual storage** - Local (fast) + Cloudinary (backup)  
✅ **Auto fallback** - If local fails, serves from Cloudinary  
✅ **Multi-language** - Thai and English titles  
✅ **Beautiful UI** - Card-based layout with preview  
✅ **Admin management** - Upload, view, toggle, delete  

---

## 📝 Upload Process

1. **Select Date** → Only Sundays allowed
2. **Choose PDF** → Max 10MB, validated
3. **Auto-generate Titles** → Based on date (editable)
4. **Upload** → Saves to local + Cloudinary backup
5. **Done** → Appears on public page immediately

---

## 🔍 How It Works

### Upload Flow
```
Admin uploads PDF
    ↓
Validates: PDF type, Sunday date, file size
    ↓
Saves to: /home/mill/hosting/bulletins/bulletin-YYYY-MM-DD.pdf
    ↓
Uploads to: Cloudinary (backup)
    ↓
Creates DB record with both paths
    ↓
Shows in admin list and public page
```

### Download Flow
```
User clicks "View" or "Download"
    ↓
API checks: Does local file exist?
    ↓
Yes → Stream from local (fast)
No → Redirect to Cloudinary (fallback)
```

---

## 🛠️ Troubleshooting

### Can't upload files?
```bash
# Check directory exists and has permissions
ssh mill@192.168.68.117
ls -la /home/mill/hosting/bulletins
chmod 755 /home/mill/hosting/bulletins
```

### "Date must be a Sunday" error?
- Use the date picker and only select Sundays
- Frontend and backend validate this

### File not showing?
- Check it's marked as "Active" in admin panel
- Click the status badge to toggle

### Cloudinary backup fails?
- It's okay! System works with local storage only
- Add Cloudinary credentials to `.env` to enable backup

---

## 📊 File Structure

```
/home/mill/hosting/
├── bulletins/                    ← PDF files stored here
│   ├── bulletin-2025-01-12.pdf
│   ├── bulletin-2025-01-19.pdf
│   └── ...
└── ...
```

---

## 🎨 UI Preview

### Admin Panel
- Clean table view with file info
- Toggle active/inactive status
- Preview and delete buttons
- Storage indicators (Local + Cloudinary)

### Public Page
- Beautiful card-based layout
- PDF icon with date badge
- View (inline) and Download buttons
- Multi-language support
- Responsive design

---

## 🔐 Security

✅ Admin-only uploads (authentication required)  
✅ File type validation (PDF only)  
✅ File size limits (10MB max)  
✅ Path safety (prevents directory traversal)  
✅ Date validation (Sunday only)  
✅ Public visibility control (active/inactive)  

---

## 📈 Stats

**Code Added:**
- 7 new API routes
- 3 admin pages
- 1 public page
- 3 React components
- 1 library module
- 1 database model

**Features:**
- Dual storage system
- Auto-fallback mechanism
- Multi-language support
- Sunday date validation
- File management
- Admin dashboard

---

## ✅ Deployment Checklist

Before going live:

- [ ] Run `./scripts/setup-bulletins-feature.sh`
- [ ] Run `./deployment/deploy-remote.sh`
- [ ] Add Cloudinary credentials to `.env` (optional but recommended)
- [ ] Test uploading a bulletin
- [ ] Verify it shows on `/bulletins` page
- [ ] Test download and preview
- [ ] Check mobile responsiveness

---

## 🎉 You're Ready!

The bulletins feature is fully implemented and ready to use. Just run the setup script, deploy, and start uploading your church bulletins!

**Questions?** Check `BULLETINS_FEATURE.md` for detailed documentation.
