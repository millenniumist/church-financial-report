const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  try {
    // Delete test mission
    const deletedMission = await prisma.mission.deleteMany({
      where: { slug: 'test-mission-2025' }
    });
    console.log(`✅ Deleted ${deletedMission.count} test mission(s)`);

    // Delete test navigation item
    const deletedNav = await prisma.navigationItem.deleteMany({
      where: { href: '/test' }
    });
    console.log(`✅ Deleted ${deletedNav.count} test navigation item(s)`);

    // Delete test page content
    const deletedPages = await prisma.pageContent.deleteMany({
      where: {
        OR: [
          { page: 'test' },
          { page: 'test-page' },
          { page: 'home', section: 'hero' }
        ]
      }
    });
    console.log(`✅ Deleted ${deletedPages.count} test page content(s)`);

    // Delete test projects
    const deletedProjects = await prisma.futureProject.deleteMany({
      where: { name: 'Test Project' }
    });
    console.log(`✅ Deleted ${deletedProjects.count} test project(s)`);

    // Note: Not deleting ContactInfo as it's a single-row table
    // that might have real data
    console.log('ℹ️  ContactInfo not deleted (single-row table)');

    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
