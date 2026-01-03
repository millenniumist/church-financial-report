#!/usr/bin/env node

// Set timezone to Bangkok for all date operations
process.env.TZ = 'Asia/Bangkok';

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PI_URL = "postgresql://ccfinapp:cc2025secure@192.168.68.117:5432/cc_financial";
const DUMP_FILE = path.join(process.cwd(), 'pi-data-dump.json');

const TABLES = [
  'FinancialRecord', 'FutureProject', 'Mission', 'ContactInfo',
  'NavigationItem', 'PageContent', 'FinancialCategory', 'CategorySettings', 'Bulletin', 'Feedback'
];

// === DUMP FROM PI ===
async function dumpFromPi() {
  console.log('📦 Dumping data from Pi database (Bangkok timezone)...\n');
  const client = new pg.Client({ connectionString: PI_URL });

  try {
    await client.connect();
    // Set timezone to Bangkok for this connection
    await client.query("SET timezone = 'Asia/Bangkok'");

    const dump = {};

    for (const table of TABLES) {
      try {
        const result = await client.query(`SELECT * FROM "${table}"`);
        dump[table] = result.rows;
        console.log(`  ✅ ${table}: ${result.rows.length} records`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
        dump[table] = [];
      }
    }

    fs.writeFileSync(DUMP_FILE, JSON.stringify(dump, null, 2));
    console.log(`\n✅ Data dumped to: ${DUMP_FILE}`);
    console.log(`📂 Size: ${(fs.statSync(DUMP_FILE).size / 1024).toFixed(2)} KB\n`);

    return dump;
  } finally {
    await client.end();
  }
}

// === LOAD TO CLOUD DB ===
async function loadToDatabase(databaseUrl, targetName, data) {
  console.log(`📥 Loading data to ${targetName}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } }
  });

  try {
    const modelMap = {
      FinancialRecord: 'financialRecord',
      FutureProject: 'futureProject',
      Mission: 'mission',
      ContactInfo: 'contactInfo',
      NavigationItem: 'navigationItem',
      PageContent: 'pageContent',
      FinancialCategory: 'financialCategory',
      CategorySettings: 'categorySettings',
      Bulletin: 'bulletin',
      Feedback: 'feedback'
    };

    for (const table of TABLES) {
      const records = data[table] || [];
      if (records.length === 0) {
        console.log(`  ⏭️  ${table}: No records`);
        continue;
      }

      try {
        await prisma[modelMap[table]].deleteMany();
        let loaded = 0;
        for (const record of records) {
          try {
            await prisma[modelMap[table]].create({ data: record });
            loaded++;
          } catch (err) {
            console.log(`    ⚠️  Error: ${err.message.split('\n')[0]}`);
          }
        }
        console.log(`  ✅ ${table}: ${loaded}/${records.length} records`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message.split('\n')[0]}`);
      }
    }
    console.log(`✅ Loaded to ${targetName}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

// === CHECK SYNC STATUS ===
async function checkStatus() {
  console.log('📊 Checking database status...\n');

  // Check Pi using pg (direct PostgreSQL)
  console.log('=== Pi (Production) ===');
  const piClient = new pg.Client({ connectionString: PI_URL });
  try {
    await piClient.connect();
    for (const table of TABLES) {
      try {
        const result = await piClient.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`  ${table}: ${result.rows[0].count} records`);
      } catch (e) {
        console.log(`  ${table}: ❌ Error`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error.message}`);
  } finally {
    await piClient.end();
  }
  console.log('');

  // Check cloud databases using Prisma (Accelerate-compatible)
  const cloudDbs = [
    { name: 'DEV', url: process.env.DATABASE_URL_DEV },
    { name: 'SECONDARY', url: process.env.DATABASE_URL_SECONDARY }
  ];

  const modelMap = {
    FinancialRecord: 'financialRecord',
    FutureProject: 'futureProject',
    Mission: 'mission',
    ContactInfo: 'contactInfo',
    NavigationItem: 'navigationItem',
    PageContent: 'pageContent',
    FinancialCategory: 'financialCategory',
    CategorySettings: 'categorySettings',
    Bulletin: 'bulletin',
    Feedback: 'feedback'
  };

  for (const db of cloudDbs) {
    console.log(`=== ${db.name} ===`);
    const prisma = new PrismaClient({
      datasources: { db: { url: db.url } }
    });

    try {
      for (const [table, model] of Object.entries(modelMap)) {
        try {
          const count = await prisma[model].count();
          console.log(`  ${table}: ${count} records`);
        } catch (e) {
          console.log(`  ${table}: ❌ Error`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Connection failed: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
    console.log('');
  }
}

// === MAIN ===
async function main() {
  const command = process.argv[2] || 'sync';

  try {
    switch (command) {
      case 'dump':
        await dumpFromPi();
        break;

      case 'load':
        if (!fs.existsSync(DUMP_FILE)) {
          console.error('❌ No dump file found. Run "npm run db:sync dump" first.');
          process.exit(1);
        }
        const data = JSON.parse(fs.readFileSync(DUMP_FILE, 'utf8'));
        await loadToDatabase(process.env.DATABASE_URL_DEV, 'DEV', data);
        await loadToDatabase(process.env.DATABASE_URL_SECONDARY, 'SECONDARY', data);
        break;

      case 'status':
        await checkStatus();
        break;

      case 'sync':
      default:
        console.log('🔄 Full Database Sync: Pi → DEV + SECONDARY\n');
        const dumpedData = await dumpFromPi();
        await loadToDatabase(process.env.DATABASE_URL_DEV, 'DEV', dumpedData);
        await loadToDatabase(process.env.DATABASE_URL_SECONDARY, 'SECONDARY', dumpedData);
        console.log('🎉 Sync complete!\n');
        await checkStatus();
        break;
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Sync Tool

Usage:
  npm run db:sync [command]

Commands:
  sync     Full sync from Pi to DEV + SECONDARY (default)
  dump     Only dump data from Pi to JSON file
  load     Only load from JSON file to DEV + SECONDARY
  status   Check all database record counts

Examples:
  npm run db:sync          # Full sync
  npm run db:sync dump     # Just export Pi data
  npm run db:sync load     # Just load to cloud DBs
  npm run db:sync status   # Check status
`);
  process.exit(0);
}

main();
