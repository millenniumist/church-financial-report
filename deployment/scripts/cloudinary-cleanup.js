#!/usr/bin/env node

/**
 * Cloudinary Cleanup Script
 *
 * Prevents storage bloating by:
 * 1. Identifying orphaned files (uploaded but not used in database)
 * 2. Removing old unused files
 * 3. Cleaning up deleted bulletin files
 *
 * Safety features:
 * - Dry-run mode by default
 * - Detailed logs of what will be deleted
 * - Configurable retention periods
 */

const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  DRY_RUN: process.env.DRY_RUN !== 'false', // Default to dry-run
  RETENTION_DAYS: parseInt(process.env.CLOUDINARY_RETENTION_DAYS || '730'), // 2 years
  FOLDER: process.env.CLOUDINARY_FOLDER || 'church-cms',
  ORPHAN_AGE_DAYS: parseInt(process.env.ORPHAN_AGE_DAYS || '7'), // Only delete orphans older than 7 days
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get all Cloudinary URLs referenced in database
 */
async function getReferencedUrls() {
  console.log('📊 Scanning database for referenced Cloudinary URLs...\n');

  const referenced = new Set();

  // Get bulletin URLs
  const bulletins = await prisma.bulletin.findMany({
    where: { cloudinaryUrl: { not: null } },
    select: { cloudinaryUrl: true },
  });
  bulletins.forEach(b => {
    if (b.cloudinaryUrl) referenced.add(extractPublicId(b.cloudinaryUrl));
  });

  // Get mission URLs
  const missions = await prisma.mission.findMany({
    select: { heroImageUrl: true, images: true },
  });
  missions.forEach(m => {
    if (m.heroImageUrl) referenced.add(extractPublicId(m.heroImageUrl));
    m.images.forEach(img => referenced.add(extractPublicId(img)));
  });

  // Get project URLs
  const projects = await prisma.futureProject.findMany({
    select: { images: true },
  });
  projects.forEach(p => {
    p.images.forEach(img => referenced.add(extractPublicId(img)));
  });

  console.log(`✓ Found ${referenced.size} referenced files in database\n`);
  return referenced;
}

/**
 * Extract public_id from Cloudinary URL
 */
function extractPublicId(url) {
  if (!url) return null;
  
  // Handles /upload/, /raw/upload/, etc.
  // For 'raw' resources, Cloudinary includes the extension in the public_id
  const isRaw = url.includes('/raw/upload/');
  
  if (isRaw) {
    const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.*?)$/);
    return match ? match[1] : url;
  }
  
  const match = url.match(/\/(?:image|video)\/upload\/(?:v\d+\/)?(.*?)(?:\.[^.]+)?$/);
  return match ? match[1] : url;
}

/**
 * Get all resources from Cloudinary folder (images and raw files)
 */
async function getCloudinaryResources() {
  console.log('☁️  Fetching all resources from Cloudinary (images and raw)...\n');

  const resourceTypes = ['image', 'raw'];
  const allResources = [];

  for (const type of resourceTypes) {
    let nextCursor = null;
    let typeCount = 0;
    
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: CONFIG.FOLDER,
        max_results: 500,
        next_cursor: nextCursor,
        resource_type: type,
      });

      allResources.push(...result.resources.map(r => ({ ...r, resource_type: type })));
      nextCursor = result.next_cursor;
      typeCount += result.resources.length;
    } while (nextCursor);
    
    console.log(`  • Found ${typeCount} ${type} files`);
  }

  console.log(`\n✓ Total found: ${allResources.length} files in Cloudinary\n`);
  return allResources;
}

/**
 * Calculate file age in days
 */
function getAgeDays(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('🧹 Cloudinary Cleanup Script');
  console.log('============================\n');

  // Check configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME not configured');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Mode: ${CONFIG.DRY_RUN ? '🔍 DRY RUN (no files will be deleted)' : '⚠️  LIVE MODE'}`);
  console.log(`  Folder: ${CONFIG.FOLDER}`);
  console.log(`  Retention: ${CONFIG.RETENTION_DAYS} days`);
  console.log(`  Orphan Age Threshold: ${CONFIG.ORPHAN_AGE_DAYS} days`);
  console.log('');

  try {
    // Get data
    const [referenced, cloudinaryFiles] = await Promise.all([
      getReferencedUrls(),
      getCloudinaryResources(),
    ]);

    // Categorize files for deletion
    const toDelete = {
      orphaned: [],
      old: [],
    };

    cloudinaryFiles.forEach(file => {
      const age = getAgeDays(file.created_at);
      const publicId = file.public_id;
      const isReferenced = referenced.has(publicId);

      // Orphaned files (not referenced in DB)
      if (!isReferenced && age > CONFIG.ORPHAN_AGE_DAYS) {
        toDelete.orphaned.push({
          publicId,
          resourceType: file.resource_type,
          age,
          size: (file.bytes / 1024).toFixed(2) + ' KB',
          created: file.created_at,
        });
      }

      // Old unreferenced files (ONLY delete if not referenced)
      if (!isReferenced && age > CONFIG.RETENTION_DAYS) {
        toDelete.old.push({
          publicId,
          resourceType: file.resource_type,
          age,
          size: (file.bytes / 1024).toFixed(2) + ' KB',
          created: file.created_at,
          referenced: false,
        });
      }
    });

    // Report findings
    console.log('📊 Analysis Results:');
    console.log('====================\n');

    console.log(`Total files in Cloudinary: ${cloudinaryFiles.length}`);
    console.log(`Referenced in database: ${referenced.size}`);
    console.log(`Orphaned files (>${CONFIG.ORPHAN_AGE_DAYS} days old): ${toDelete.orphaned.length}`);
    console.log(`Old files (>${CONFIG.RETENTION_DAYS} days): ${toDelete.old.length}`);
    console.log('');

    // Calculate total savings
    const orphanedBytes = toDelete.orphaned.reduce((sum, f) => {
      const file = cloudinaryFiles.find(cf => cf.public_id === f.publicId);
      return sum + (file ? file.bytes : 0);
    }, 0);

    const oldBytes = toDelete.old.reduce((sum, f) => {
      const file = cloudinaryFiles.find(cf => cf.public_id === f.publicId);
      return sum + (file ? file.bytes : 0);
    }, 0);

    console.log(`Space to recover from orphaned files: ${(orphanedBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Space to recover from old files: ${(oldBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // Show orphaned files
    if (toDelete.orphaned.length > 0) {
      console.log('🗑️  Orphaned Files (not referenced in database):');
      console.log('================================================\n');
      toDelete.orphaned.slice(0, 10).forEach(f => {
        console.log(`  • ${f.publicId}`);
        console.log(`    Age: ${f.age} days | Size: ${f.size} | Created: ${f.created}`);
      });
      if (toDelete.orphaned.length > 10) {
        console.log(`  ... and ${toDelete.orphaned.length - 10} more`);
      }
      console.log('');
    }

    // Show old files
    if (toDelete.old.length > 0) {
      console.log(`🗑️  Old Unreferenced Files (>${CONFIG.RETENTION_DAYS} days):`);
      console.log('=====================================================\n');
      toDelete.old.slice(0, 10).forEach(f => {
        console.log(`  • ${f.publicId}`);
        console.log(`    Age: ${f.age} days | Size: ${f.size} | Created: ${f.created}`);
      });
      if (toDelete.old.length > 10) {
        console.log(`  ... and ${toDelete.old.length - 10} more`);
      }
      console.log('');
    }

    // Perform deletion
    if (toDelete.orphaned.length > 0 || toDelete.old.length > 0) {
      if (CONFIG.DRY_RUN) {
        console.log('🔍 DRY RUN MODE - No files will be deleted');
        console.log('');
        console.log('To actually delete these files, run with:');
        console.log('  DRY_RUN=false node cloudinary-cleanup.js');
        console.log('');
      } else {
        console.log('⚠️  DELETING FILES...\n');

        const allToDelete = [...toDelete.orphaned, ...toDelete.old]
          .filter((file, index, self) => 
            index === self.findIndex((f) => f.publicId === file.publicId)
          ); // Remove duplicates

        let deleted = 0;
        let failed = 0;

        for (const file of allToDelete) {
          try {
            await cloudinary.uploader.destroy(file.publicId, {
              resource_type: file.resourceType
            });
            console.log(`  ✓ Deleted [${file.resourceType}]: ${file.publicId}`);
            deleted++;
          } catch (error) {
            console.error(`  ✗ Failed to delete ${file.publicId}: ${error.message}`);
            failed++;
          }
        }

        console.log('');
        console.log(`✓ Cleanup complete: ${deleted} deleted, ${failed} failed`);
      }
    } else {
      console.log('✅ No files need cleanup - Cloudinary is clean!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanup();
