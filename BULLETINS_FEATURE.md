# 📄 Bulletins Feature - Implementation Complete

## ✅ What Was Created

### 1. **Database Model** (`prisma/schema.prisma`)
   - ✅ Added `Bulletin` model with multi-language support
   - ✅ Supports both local storage and Cloudinary backup
   - ✅ Indexes for efficient date-based queries
   - ✅ Active/inactive status for controlling visibility

### 2. **Backend Library** (`lib/bulletins.js`)
   - ✅ CRUD operations for bulletins
   - ✅ Helper functions for Sunday date validation
   - ✅ Local file management
   - ✅ File stream handling with fallback support

### 3. **Admin API Routes**
   - ✅ `POST /api/admin/bulletins` - Upload new bulletin
   - ✅ `GET /api/admin/bulletins` - List all bulletins (admin)
   - ✅ `GET /api/admin/bulletins/[id]` - Get single bulletin
   - ✅ `PATCH /api/admin/bulletins/[id]` - Update bulletin
   - ✅ `DELETE /api/admin/bulletins/[id]` - Delete bulletin

### 4. **Public API Routes**
   - ✅ `GET /api/bulletins` - List active bulletins (public)
   - ✅ `GET /api/bulletins/[id]` - Serve PDF file (with fallback)

### 5. **Admin Pages**
   - ✅ `/admin/bulletins` - List and manage bulletins
   - ✅ `/admin/bulletins/new` - Upload new bulletin
   - ✅ Added "Bulletins" to admin navigation

### 6. **Public Page**
   - ✅ `/bulletins` - Beautiful public view of all bulletins
   - ✅ Download and preview functionality
   - ✅ Pagination support
   - ✅ Multi-language display (Thai/English)

---

## 🎯 Key Features

### Dual Storage System
- **Primary Storage**: Local filesystem on Raspberry Pi (`/home/mill/hosting/bulletins`)
- **Backup Storage**: Cloudinary (automatic backup on upload)
- **Smart Fallback**: Serves from local first, falls back to Cloudinary if local fails

### Sunday-Only Date Picker
- ✅ Only allows selecting Sundays
- ✅ Auto-generates titles based on selected date
- ✅ Validation on both frontend and backend

### File Management
- ✅ PDF files only (validated)
- ✅ File size limit: 10MB
- ✅ Automatic filename generation: `bulletin-YYYY-MM-DD.pdf`
- ✅ Safe file storage with proper path handling

### Multi-Language Support
- ✅ Thai and English titles
- ✅ Auto-generated from date if not provided
- ✅ Formatted dates in both languages

### Admin Features
- ✅ Upload new bulletins
- ✅ View/Preview bulletins
- ✅ Toggle active/inactive status
- ✅ Delete bulletins (removes file and DB record)
- ✅ Storage status indicator (Local/Cloudinary)
- ✅ File size display
- ✅ Pagination

### Public Features
- ✅ Beautiful card-based layout
- ✅ View in browser (inline PDF)
- ✅ Download button
- ✅ Pagination
- ✅ Responsive design
- ✅ Storage indicators

---

## 📁 File Structure

```
app/
├── bulletins/
│   └── page.js                          # Public bulletins page
├── admin/(protected)/bulletins/
│   ├── page.js                          # Admin bulletins list
│   └── new/
│       └── page.js                      # Upload new bulletin
└── api/
    ├── bulletins/
    │   ├── route.js                     # Public list API
    │   └── [id]/
    │       └── route.js                 # Serve PDF with fallback
    └── admin/bulletins/
        ├── route.js                     # Admin upload & list API
        └── [id]/
            └── route.js                 # Admin update & delete API

components/
└── admin/
    ├── BulletinForm.js                  # Upload form component
    ├── BulletinsList.js                 # Admin list component
    └── AdminNav.js                      # Updated with Bulletins link

lib/
└── bulletins.js                         # Core bulletin functions

prisma/
├── schema.prisma                        # Updated with Bulletin model
└── migrations/
    └── XXXXXX_add_bulletins_model/
        └── migration.sql                # Database migration
```

---

## 🚀 Deployment Steps

### 1. Update Environment Variables

Add to your `.env` file (or deployment/.env):

```bash
# Bulletins Storage Path
BULLETINS_STORAGE_PATH="/home/mill/hosting/bulletins"

# Cloudinary (for backup - optional but recommended)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 2. Create Bulletins Directory on Server

SSH into your server and create the directory:

```bash
ssh mill@192.168.68.117
mkdir -p /home/mill/hosting/bulletins
chmod 755 /home/mill/hosting/bulletins
exit
```

### 3. Run Database Migration

**Option A: From your local machine (if connected to DB)**
```bash
npx prisma migrate deploy
```

**Option B: On the remote server**
```bash
ssh mill@192.168.68.117
cd /home/mill/hosting
npx prisma migrate deploy
exit
```

### 4. Deploy the Code

```bash
cd /Users/suparit/Desktop/code/cc-financial
./deployment/deploy-remote.sh
```

This will:
- Sync all new files to the server
- Rebuild the Docker container
- Restart the application
- Ensure Cloudflare tunnel is running

---

## 📝 How to Use

### For Admins

1. **Login to Admin Panel**
   - Go to: https://millenniumist.dpdns.org/admin/login

2. **Navigate to Bulletins**
   - Click "Bulletins" in the admin navigation

3. **Upload a New Bulletin**
   - Click "อัพโหลดสูจิบัตรใหม่ / Upload New Bulletin"
   - Select a Sunday date (only Sundays are allowed)
   - Choose a PDF file (max 10MB)
   - Titles are auto-generated but can be edited
   - Click "อัพโหลด / Upload"

4. **Manage Bulletins**
   - View all bulletins in the list
   - Toggle active/inactive status
   - Preview or delete bulletins
   - See storage status (Local + Cloudinary backup)

### For Public Users

1. **Visit Bulletins Page**
   - Go to: https://millenniumist.dpdns.org/bulletins

2. **View Bulletins**
   - See all published bulletins in a card layout
   - Click "ดู / View" to preview in browser
   - Click "ดาวน์โหลด / Download" to save the PDF

---

## 🔧 Technical Details

### Storage Flow

1. **Upload**:
   ```
   User uploads PDF → Saves to local (/home/mill/hosting/bulletins)
                    → Uploads to Cloudinary (backup)
                    → Creates DB record with both paths
   ```

2. **Retrieval**:
   ```
   User requests PDF → Checks local file exists
                    → If yes: Stream from local (fast)
                    → If no: Redirect to Cloudinary (fallback)
   ```

### Database Schema

```sql
CREATE TABLE "Bulletin" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,              -- {"th": "...", "en": "..."}
    "date" TIMESTAMP(3) NOT NULL,        -- Sunday service date
    "localPath" TEXT NOT NULL,           -- "bulletin-2025-01-12.pdf"
    "cloudinaryUrl" TEXT,                -- "https://res.cloudinary.com/..."
    "fileSize" INTEGER,                  -- File size in bytes
    "isActive" BOOLEAN DEFAULT true,     -- Published status
    "createdAt" TIMESTAMP(3) DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);
```

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/bulletins` | Public | List active bulletins |
| GET | `/api/bulletins/[id]` | Public | Serve PDF file |
| GET | `/api/admin/bulletins` | Admin | List all bulletins |
| POST | `/api/admin/bulletins` | Admin | Upload new bulletin |
| GET | `/api/admin/bulletins/[id]` | Admin | Get bulletin details |
| PATCH | `/api/admin/bulletins/[id]` | Admin | Update bulletin |
| DELETE | `/api/admin/bulletins/[id]` | Admin | Delete bulletin |

---

## 🧪 Testing Checklist

Before deploying, test these scenarios:

### Admin Tests
- [ ] Login to admin panel
- [ ] Navigate to Bulletins section
- [ ] Try uploading a PDF for a Sunday date
- [ ] Verify file is saved locally
- [ ] Check Cloudinary backup was created
- [ ] View the bulletin in the list
- [ ] Toggle active/inactive status
- [ ] Preview the PDF
- [ ] Delete a bulletin

### Public Tests
- [ ] Visit `/bulletins` page
- [ ] See all active bulletins
- [ ] Click "View" to preview in browser
- [ ] Click "Download" to save PDF
- [ ] Test pagination (if > 12 bulletins)
- [ ] Verify inactive bulletins are hidden

### Edge Cases
- [ ] Try selecting a non-Sunday date (should show error)
- [ ] Try uploading non-PDF file (should reject)
- [ ] Try uploading > 10MB file (should reject)
- [ ] Simulate local file missing (should fallback to Cloudinary)
- [ ] Test without Cloudinary configured (should work with local only)

---

## 🔐 Security Considerations

✅ **Authentication**: All admin endpoints require authentication  
✅ **File Type Validation**: Only PDF files allowed  
✅ **File Size Limit**: 10MB maximum  
✅ **Date Validation**: Only Sundays can be selected  
✅ **Path Safety**: Uses `path.basename()` to prevent directory traversal  
✅ **Public Access Control**: Only active bulletins are publicly visible  

---

## 🌐 URLs

### Admin URLs
- List: `https://millenniumist.dpdns.org/admin/bulletins`
- Upload: `https://millenniumist.dpdns.org/admin/bulletins/new`

### Public URLs
- View All: `https://millenniumist.dpdns.org/bulletins`
- Direct PDF: `https://millenniumist.dpdns.org/api/bulletins/[id]`

---

## 🐛 Troubleshooting

### Issue: "Failed to upload bulletin"
**Solution**: Check that the bulletins directory exists and has proper permissions:
```bash
ssh mill@192.168.68.117
ls -la /home/mill/hosting/bulletins
chmod 755 /home/mill/hosting/bulletins
```

### Issue: "Local file not available"
**Solution**: The system will automatically fallback to Cloudinary. If both fail:
1. Check file exists: `ls -la /home/mill/hosting/bulletins/`
2. Check file permissions
3. Verify Cloudinary credentials in `.env`

### Issue: "Only PDF files are allowed"
**Solution**: Ensure you're uploading a valid PDF file (not image or other format)

### Issue: "Date must be a Sunday"
**Solution**: Use the date picker and only select dates that fall on Sunday

### Issue: Cloudinary backup fails
**Solution**: This is okay! The system will continue with local storage only. To fix:
1. Add Cloudinary credentials to `.env`
2. Restart the application

---

## 📊 Future Enhancements (Optional)

Ideas for future improvements:
- [ ] Bulk upload multiple bulletins
- [ ] PDF thumbnail preview
- [ ] Search/filter by date range
- [ ] Email notifications when new bulletin is uploaded
- [ ] Archive old bulletins automatically
- [ ] PDF viewer embedded in the page
- [ ] QR code generation for easy mobile access
- [ ] Download statistics tracking

---

## 🎉 Summary

✅ **Complete bulletins system implemented**  
✅ **Dual storage (Local + Cloudinary backup)**  
✅ **Sunday-only date selection**  
✅ **Admin upload and management**  
✅ **Public viewing and download**  
✅ **Multi-language support (Thai/English)**  
✅ **Responsive and beautiful UI**  
✅ **Ready for deployment**  

**Next Steps:**
1. Run database migration
2. Create bulletins directory on server
3. Deploy with `./deployment/deploy-remote.sh`
4. Test uploading your first bulletin!

---

**Need help?** Check the troubleshooting section or review the code in the files listed above.
