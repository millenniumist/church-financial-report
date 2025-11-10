#!/usr/bin/env node

/**
 * Data Migration Script: Supabase → Local PostgreSQL
 *
 * This script exports all data from Supabase and imports it into local PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Source: Supabase with Accelerate
const sourceUrl = process.env.DATABASE_URL_SUPABASE;
const sourcePrisma = new PrismaClient({
  datasources: { db: { url: sourceUrl } }
}).$extends(withAccelerate());

// Target: Local PostgreSQL
const targetUrl = process.env.DATABASE_URL;
const targetPrisma = new PrismaClient({
  datasources: { db: { url: targetUrl } }
});

async function exportData() {
  console.log('📥 Exporting data from Supabase...\n');

  const data = {
    financialRecords: await sourcePrisma.financialRecord.findMany(),
    futureProjects: await sourcePrisma.futureProject.findMany(),
    missions: await sourcePrisma.mission.findMany(),
    contactInfo: await sourcePrisma.contactInfo.findMany(),
    navigationItems: await sourcePrisma.navigationItem.findMany(),
    pageContent: await sourcePrisma.pageContent.findMany(),
    financialCategories: await sourcePrisma.financialCategory.findMany(),
    categorySettings: await sourcePrisma.categorySettings.findMany(),
  };

  console.log('✓ Exported data:');
  console.log(`  - FinancialRecords: ${data.financialRecords.length}`);
  console.log(`  - FutureProjects: ${data.futureProjects.length}`);
  console.log(`  - Missions: ${data.missions.length}`);
  console.log(`  - ContactInfo: ${data.contactInfo.length}`);
  console.log(`  - NavigationItems: ${data.navigationItems.length}`);
  console.log(`  - PageContent: ${data.pageContent.length}`);
  console.log(`  - FinancialCategories: ${data.financialCategories.length}`);
  console.log(`  - CategorySettings: ${data.categorySettings.length}`);
  console.log('');

  return data;
}

async function importData(data) {
  console.log('📤 Importing data to local PostgreSQL...\n');

  // Import in order (respecting foreign key constraints)

  // 1. ContactInfo (independent)
  if (data.contactInfo.length > 0) {
    console.log('Importing ContactInfo...');
    for (const record of data.contactInfo) {
      await targetPrisma.contactInfo.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.contactInfo.length} ContactInfo records`);
  }

  // 2. NavigationItems (independent)
  if (data.navigationItems.length > 0) {
    console.log('Importing NavigationItems...');
    for (const record of data.navigationItems) {
      await targetPrisma.navigationItem.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.navigationItems.length} NavigationItems`);
  }

  // 3. PageContent (independent)
  if (data.pageContent.length > 0) {
    console.log('Importing PageContent...');
    for (const record of data.pageContent) {
      await targetPrisma.pageContent.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.pageContent.length} PageContent records`);
  }

  // 4. Missions (independent)
  if (data.missions.length > 0) {
    console.log('Importing Missions...');
    for (const record of data.missions) {
      await targetPrisma.mission.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.missions.length} Missions`);
  }

  // 5. FutureProjects (independent)
  if (data.futureProjects.length > 0) {
    console.log('Importing FutureProjects...');
    for (const record of data.futureProjects) {
      await targetPrisma.futureProject.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.futureProjects.length} FutureProjects`);
  }

  // 6. FinancialCategories (independent)
  if (data.financialCategories.length > 0) {
    console.log('Importing FinancialCategories...');
    for (const record of data.financialCategories) {
      await targetPrisma.financialCategory.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.financialCategories.length} FinancialCategories`);
  }

  // 7. CategorySettings (independent)
  if (data.categorySettings.length > 0) {
    console.log('Importing CategorySettings...');
    for (const record of data.categorySettings) {
      await targetPrisma.categorySettings.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.categorySettings.length} CategorySettings`);
  }

  // 8. FinancialRecords (independent)
  if (data.financialRecords.length > 0) {
    console.log('Importing FinancialRecords...');
    for (const record of data.financialRecords) {
      await targetPrisma.financialRecord.upsert({
        where: { id: record.id },
        create: record,
        update: record,
      });
    }
    console.log(`✓ Imported ${data.financialRecords.length} FinancialRecords`);
  }

  console.log('');
  console.log('✅ Data migration completed successfully!');
}

async function main() {
  console.log('🚀 Starting data migration from Supabase to Local PostgreSQL\n');
  console.log(`Source: ${sourceUrl.substring(0, 50)}...`);
  console.log(`Target: ${targetUrl}\n`);

  try {
    // Export from Supabase
    const data = await exportData();

    // Import to Local PostgreSQL
    await importData(data);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

main();
