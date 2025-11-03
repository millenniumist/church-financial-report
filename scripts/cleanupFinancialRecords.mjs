import { prisma } from '../lib/prisma.js';

function monthKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  const records = await prisma.financialRecord.findMany({
    orderBy: { date: 'asc' },
  });

  const seen = new Map();
  const duplicateIds = [];

  for (const record of records) {
    const key = monthKey(record.date);
    if (!seen.has(key)) {
      seen.set(key, record);
    } else {
      duplicateIds.push(record.id);
    }
  }

  if (duplicateIds.length) {
    await prisma.financialRecord.deleteMany({
      where: { id: { in: duplicateIds } },
    });
  }

  console.log(
    JSON.stringify(
      {
        scanned: records.length,
        removedDuplicates: duplicateIds.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
