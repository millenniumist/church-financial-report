import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getBulletins, createBulletin, ensureBulletinsDir, formatBulletinFilename, isSunday } from '@/lib/bulletins';
import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const BULLETINS_DIR = process.env.BULLETINS_STORAGE_PATH || '/home/mill/hosting/bulletins';

// GET - List all bulletins
export async function GET(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const result = await getBulletins({ page, limit, activeOnly });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching bulletins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulletins', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload new bulletin
export async function POST(request) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const date = formData.get('date');
    const titleTh = formData.get('titleTh');
    const titleEn = formData.get('titleEn');

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate it's a Sunday
    if (!isSunday(date)) {
      return NextResponse.json({ error: 'Date must be a Sunday' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Ensure bulletins directory exists
    await ensureBulletinsDir();

    // Generate filename
    const filename = formatBulletinFilename(date);
    const localPath = path.join(BULLETINS_DIR, filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to local storage (PRIMARY)
    await fs.writeFile(localPath, buffer);
    console.log('✓ Saved to local storage:', localPath);

    // Upload to Cloudinary as backup (SECONDARY)
    let cloudinaryUrl = null;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'church-cms/bulletins',
                resource_type: 'raw',
                public_id: filename.replace('.pdf', ''),
                format: 'pdf'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });
        cloudinaryUrl = result.secure_url;
        console.log('✓ Backed up to Cloudinary:', cloudinaryUrl);
      } catch (error) {
        console.error('⚠ Cloudinary backup failed (continuing with local only):', error);
        // Continue even if Cloudinary fails - we have local storage
      }
    }

    // Create database record
    const bulletin = await createBulletin({
      title: {
        th: titleTh || `สูจิบัตร ${new Date(date).toLocaleDateString('th-TH', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`,
        en: titleEn || `Bulletin ${new Date(date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`
      },
      date: new Date(date),
      localPath: filename, // Store relative path
      cloudinaryUrl,
      fileSize: buffer.length,
      isActive: true
    });

    return NextResponse.json({ 
      success: true, 
      bulletin,
      storage: {
        local: true,
        cloudinary: !!cloudinaryUrl
      }
    });
  } catch (error) {
    console.error('Error uploading bulletin:', error);
    return NextResponse.json(
      { error: 'Failed to upload bulletin', details: error.message },
      { status: 500 }
    );
  }
}
