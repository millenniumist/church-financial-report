import { NextResponse } from 'next/server';
import { getBulletinById, checkLocalFile, getLocalFileStream } from '@/lib/bulletins';

// GET - Serve bulletin file (with fallback to Cloudinary)
export async function GET(request, { params }) {
  try {
    const bulletin = await getBulletinById(params.id);

    if (!bulletin || !bulletin.isActive) {
      return NextResponse.json({ error: 'Bulletin not found' }, { status: 404 });
    }

    // Try local file first (PRIMARY)
    const hasLocalFile = await checkLocalFile(bulletin.localPath);
    
    if (hasLocalFile) {
      try {
        const { stream, size } = await getLocalFileStream(bulletin.localPath);
        
        // Return file stream
        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': size.toString(),
            'Content-Disposition': `inline; filename="${bulletin.localPath}"`,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      } catch (error) {
        console.error('Error reading local file:', error);
        // Fall through to Cloudinary backup
      }
    }

    // Fallback to Cloudinary (BACKUP)
    if (bulletin.cloudinaryUrl) {
      console.log('Local file not available, redirecting to Cloudinary backup');
      return NextResponse.redirect(bulletin.cloudinaryUrl);
    }

    // No file available
    return NextResponse.json(
      { error: 'Bulletin file not available' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error serving bulletin:', error);
    return NextResponse.json(
      { error: 'Failed to serve bulletin', details: error.message },
      { status: 500 }
    );
  }
}
