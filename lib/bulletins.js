import { prisma } from './prisma';
import { promises as fs } from 'fs';
import path from 'path';

// Local storage path on Raspberry Pi
const BULLETINS_DIR = process.env.BULLETINS_STORAGE_PATH || '/home/mill/hosting/bulletins';

/**
 * Ensure bulletins directory exists
 */
export async function ensureBulletinsDir() {
  try {
    await fs.mkdir(BULLETINS_DIR, { recursive: true });
    return true;
  } catch (error) {
    console.error('Error creating bulletins directory:', error);
    return false;
  }
}

/**
 * Get all bulletins with pagination
 */
export async function getBulletins({ page = 1, limit = 20, activeOnly = true } = {}) {
  try {
    const where = activeOnly ? { isActive: true } : {};
    
    const [bulletins, total] = await Promise.all([
      prisma.bulletin.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bulletin.count({ where }),
    ]);

    return {
      bulletins,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching bulletins:', error);
    throw error;
  }
}

/**
 * Get bulletin by ID
 */
export async function getBulletinById(id) {
  try {
    return await prisma.bulletin.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching bulletin:', error);
    throw error;
  }
}

/**
 * Get bulletin by date
 */
export async function getBulletinByDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await prisma.bulletin.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching bulletin by date:', error);
    throw error;
  }
}

/**
 * Create new bulletin
 */
export async function createBulletin(data) {
  try {
    return await prisma.bulletin.create({
      data,
    });
  } catch (error) {
    console.error('Error creating bulletin:', error);
    throw error;
  }
}

/**
 * Update bulletin
 */
export async function updateBulletin(id, data) {
  try {
    return await prisma.bulletin.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error('Error updating bulletin:', error);
    throw error;
  }
}

/**
 * Delete bulletin (and associated files)
 */
export async function deleteBulletin(id) {
  try {
    const bulletin = await getBulletinById(id);
    if (!bulletin) {
      throw new Error('Bulletin not found');
    }

    // Delete local file if exists
    if (bulletin.localPath) {
      try {
        const filePath = path.join(BULLETINS_DIR, path.basename(bulletin.localPath));
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting local file:', error);
        // Continue even if file deletion fails
      }
    }

    // Delete database record
    return await prisma.bulletin.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    throw error;
  }
}

/**
 * Check if local file exists
 */
export async function checkLocalFile(localPath) {
  try {
    const filePath = path.join(BULLETINS_DIR, path.basename(localPath));
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stream from local storage
 */
export async function getLocalFileStream(localPath) {
  const filePath = path.join(BULLETINS_DIR, path.basename(localPath));
  const stats = await fs.stat(filePath);
  const stream = require('fs').createReadStream(filePath);
  
  return { stream, size: stats.size };
}

/**
 * Get next Sunday from a given date
 */
export function getNextSunday(date = new Date()) {
  const result = new Date(date);
  result.setDate(result.getDate() + (7 - result.getDay()) % 7);
  if (result.getDay() !== 0) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

/**
 * Check if date is a Sunday
 */
export function isSunday(date) {
  return new Date(date).getDay() === 0;
}

/**
 * Format bulletin filename
 */
export function formatBulletinFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `bulletin-${year}-${month}-${day}.pdf`;
}
