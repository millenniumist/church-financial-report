# Admin Panel Setup Guide

This document explains the new admin panel feature that allows you to manage missions and projects with image carousels, replacing the need for Google Sheets for content management.

## Features

### Admin Panel Capabilities
- **Dashboard**: Overview of missions and projects with quick statistics
- **Projects Management**: Full CRUD operations for fundraising projects
- **Missions Management**: Full CRUD operations for church missions
- **Image Carousel**: Upload and manage multiple images for each project/mission with auto-playing carousel
- **Authentication**: Simple password-protected admin access
- **Image Upload**: Direct image uploads to Cloudinary

### What's New
1. **Database Schema Updates**:
   - Added `images` field (String array) to both `Mission` and `FutureProject` models
   - Supports multiple images per item with carousel display

2. **Image Carousel**:
   - Auto-playing carousel with 5-second intervals
   - Manual navigation with arrow buttons
   - Dot indicators showing current slide
   - Image counter overlay
   - Reorderable images (first image is the main/hero image)

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env` file:

```env
# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Cloudinary Setup

1. Create a free account at [https://cloudinary.com](https://cloudinary.com)
2. Get your credentials from the Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Add them to your `.env` file

### 3. Database Migration

The schema has already been updated. If you haven't applied the changes:

```bash
npx prisma db push
```

## Usage

### Accessing the Admin Panel

1. Navigate to `/admin/login`
2. Enter your admin credentials (from `.env`)
3. You'll be redirected to the dashboard

### Managing Projects

#### Create a New Project
1. Go to **Admin > Projects** or click **+ New Project** from the dashboard
2. Fill in the project details:
   - **Name**: Project title (required)
   - **Description**: Brief description
   - **Target Amount**: Fundraising goal in Thai Baht
   - **Current Amount**: Current raised amount
   - **Priority**: Higher number = displayed first
   - **Active**: Toggle to show/hide on public site
   - **Images**: Upload multiple images for the carousel

#### Upload Images
1. Click the upload area or drag and drop images
2. Multiple images can be uploaded at once
3. Reorder images using the arrow buttons (← →)
4. First image will be the main/hero image
5. Remove images with the × button

#### Edit a Project
1. Go to **Admin > Projects**
2. Click **Edit** on any project
3. Update fields and save

#### Delete a Project
1. Go to **Admin > Projects**
2. Click **Delete** on any project
3. Confirm the deletion

### Managing Missions

Mission management works the same way as projects, but with additional fields for:
- Multilingual content (title, theme, summary, description)
- Focus areas
- Scripture references
- Next steps
- Pinned status (for highlighting important missions)
- Start and end dates

## Front-End Display

### Projects Page (`/projects`)
- Projects are displayed in a grid layout
- Each project shows:
  - **Image Carousel** (if images exist)
  - Project name and description
  - Progress bar with percentage
  - Current amount vs. target amount
  - Remaining amount needed

### Carousel Features
- **Auto-play**: Images rotate every 5 seconds
- **Manual navigation**: Click arrows to navigate
- **Indicators**: Dots show total images and current position
- **Counter**: Shows current image number (e.g., "1 / 3")
- **Hover effects**: Navigation arrows appear on hover

## Technical Architecture

### API Endpoints

#### Projects
- `GET /api/admin/projects` - List all projects
- `POST /api/admin/projects` - Create new project
- `GET /api/admin/projects/[id]` - Get single project
- `PATCH /api/admin/projects/[id]` - Update project
- `DELETE /api/admin/projects/[id]` - Delete project

#### Missions
- `GET /api/admin/missions` - List all missions
- `POST /api/admin/missions` - Create new mission
- `GET /api/admin/missions/[id]` - Get single mission
- `PATCH /api/admin/missions/[id]` - Update mission
- `DELETE /api/admin/missions/[id]` - Delete mission

#### Upload
- `POST /api/admin/upload` - Upload image to Cloudinary

#### Authentication
- `POST /api/admin/login` - Login to admin panel
- `POST /api/admin/logout` - Logout from admin panel

### File Structure

```
/app/admin/
  ├── layout.js              # Admin layout with auth check
  ├── login/
  │   ├── layout.js          # Bypass auth for login page
  │   └── page.js            # Login form
  ├── page.js                # Dashboard
  ├── projects/
  │   ├── page.js            # Projects list
  │   ├── new/page.js        # Create project
  │   └── [id]/page.js       # Edit project
  └── missions/              # (Similar structure)

/app/api/admin/
  ├── login/route.js         # Login endpoint
  ├── logout/route.js        # Logout endpoint
  ├── upload/route.js        # Image upload endpoint
  ├── projects/
  │   ├── route.js           # List/Create projects
  │   └── [id]/route.js      # Get/Update/Delete project
  └── missions/              # (Similar structure)

/components/
  ├── admin/
  │   ├── AdminNav.js        # Admin navigation bar
  │   ├── ProjectsList.js    # Projects table
  │   ├── ProjectForm.js     # Project create/edit form
  │   └── ImageUpload.js     # Image upload component
  └── ImageCarousel.js       # Public-facing carousel

/lib/
  └── auth.js                # Authentication helpers
```

## Security Considerations

1. **Authentication**:
   - Currently uses simple cookie-based auth
   - Consider implementing NextAuth.js for production
   - Change default admin password immediately

2. **Image Upload**:
   - Files are uploaded directly to Cloudinary
   - No local file storage
   - Cloudinary provides automatic image optimization

3. **API Protection**:
   - All admin APIs check for valid session
   - Unauthorized requests return 401

## Migrating from Google Sheets

To migrate existing projects from Google Sheets:

1. Export your projects data from Google Sheets
2. Create each project manually through the admin panel
3. Upload relevant images for each project
4. Verify on the public `/projects` page
5. Once confirmed, you can stop using the Google Sheets sync for projects

## Future Enhancements

Potential improvements for the admin panel:

1. **Bulk Operations**: Import/export projects via CSV
2. **Image Optimization**: Automatic resizing and compression
3. **Role-Based Access**: Different permission levels
4. **Audit Log**: Track who made what changes
5. **Draft Mode**: Save drafts before publishing
6. **Rich Text Editor**: Better formatting for descriptions
7. **Analytics**: View statistics for each project/mission

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in `.env`
- Verify your Cloudinary account is active
- Check browser console for errors

### Cannot login
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Clear browser cookies and try again
- Check server logs for authentication errors

### Projects not displaying
- Check if projects are marked as "Active"
- Verify database connection
- Check for errors in browser console

## Support

For issues or questions:
1. Check the browser console for errors
2. Check server logs: `npm run dev`
3. Verify all environment variables are set correctly
4. Review the [Prisma documentation](https://www.prisma.io/docs) for database issues
5. Review the [Cloudinary documentation](https://cloudinary.com/documentation) for upload issues

---

**Last Updated**: 2025-11-04
**Version**: 1.0.0
