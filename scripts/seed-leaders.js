const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const leaders = [
  { name: 'อ.ปฐมพร สิงห์คำป้อง', position: 'ศิษยาภิบาล', order: 1 },
  { name: 'อ.จันทรา ตันสกุล', position: 'ศาสนาจารย์', order: 2 },
  { name: 'อ.เสารว์ณีย์ อิ่มใจกล้า', position: 'อนุศาสนาจารย์', order: 3 },
  { name: 'อาจารย์ เจษฎา ต่อมแก้ว', position: 'อาจารย์', order: 4 },
  { name: 'อาจารย์ ชิโร', position: 'อาจารย์', order: 5 },
];

async function main() {
  console.log('Start seeding church leaders...');
  
  // Clear existing data to avoid duplicates if run multiple times
  await prisma.churchLeader.deleteMany({});

  for (const leader of leaders) {
    const created = await prisma.churchLeader.create({
      data: leader,
    });
    console.log(`Created leader: ${created.name}`);
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
