const { prisma } = require('../lib/prisma');

async function main() {
  console.log('Starting verification...');
  try {
    const count = await prisma.mission.count();
    console.log('✅ Success! Mission count:', count);
  } catch (e) {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  }
}

main();
