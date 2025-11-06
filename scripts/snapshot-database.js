/**
 * Database Snapshot Script
 *
 * Creates a complete snapshot of all data in the database
 * to be used for seeding and testing purposes.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createSnapshot() {
  console.log('📸 Creating database snapshot...\n');

  try {
    // Fetch all data from all tables
    const [
      missions,
      projects,
      financialRecords,
      navigationItems,
      contactInfo,
      pageContent
    ] = await Promise.all([
      prisma.mission.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.futureProject.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.financialRecord.findMany({ orderBy: { date: 'asc' } }),
      prisma.navigationItem.findMany({ orderBy: { order: 'asc' } }),
      prisma.contactInfo.findFirst(),
      prisma.pageContent.findMany({ orderBy: { createdAt: 'asc' } })
    ]);

    const snapshot = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        description: 'Complete database snapshot for seeding and testing'
      },
      data: {
        missions: missions.map(cleanRecord),
        projects: projects.map(cleanRecord),
        financialRecords: financialRecords.map(cleanRecord),
        navigationItems: navigationItems.map(cleanRecord),
        contactInfo: contactInfo ? cleanRecord(contactInfo) : null,
        pageContent: pageContent.map(cleanRecord)
      },
      stats: {
        missions: missions.length,
        projects: projects.length,
        financialRecords: financialRecords.length,
        navigationItems: navigationItems.length,
        contactInfo: contactInfo ? 1 : 0,
        pageContent: pageContent.length
      }
    };

    // Write to file
    const outputPath = path.join(__dirname, '..', 'prisma', 'snapshot.json');
    fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));

    console.log('✅ Snapshot created successfully!\n');
    console.log('📊 Statistics:');
    console.log(`   Missions: ${snapshot.stats.missions}`);
    console.log(`   Projects: ${snapshot.stats.projects}`);
    console.log(`   Financial Records: ${snapshot.stats.financialRecords}`);
    console.log(`   Navigation Items: ${snapshot.stats.navigationItems}`);
    console.log(`   Contact Info: ${snapshot.stats.contactInfo}`);
    console.log(`   Page Content: ${snapshot.stats.pageContent}`);
    console.log(`\n📁 Saved to: ${outputPath}`);

    return snapshot;
  } catch (error) {
    console.error('❌ Error creating snapshot:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clean record by removing internal fields and converting dates
 */
function cleanRecord(record) {
  const cleaned = { ...record };

  // Convert dates to ISO strings for JSON serialization
  if (cleaned.createdAt) cleaned.createdAt = cleaned.createdAt.toISOString();
  if (cleaned.updatedAt) cleaned.updatedAt = cleaned.updatedAt.toISOString();
  if (cleaned.startDate) cleaned.startDate = cleaned.startDate.toISOString();
  if (cleaned.endDate) cleaned.endDate = cleaned.endDate.toISOString();
  if (cleaned.date) cleaned.date = cleaned.date.toISOString();

  return cleaned;
}

// Run if called directly
if (require.main === module) {
  createSnapshot()
    .then(() => {
      console.log('\n✨ Snapshot complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Snapshot failed:', error);
      process.exit(1);
    });
}

module.exports = { createSnapshot };
