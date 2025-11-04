const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addProjectsNav() {
  try {
    // Check if projects nav already exists
    const existing = await prisma.navigationItem.findFirst({
      where: { href: '/projects' }
    });

    if (existing) {
      console.log('✓ Projects navigation already exists:', existing);
      return;
    }

    // Get current navigation items to determine order
    const navItems = await prisma.navigationItem.findMany({
      orderBy: { order: 'asc' }
    });

    console.log('Current navigation items:');
    navItems.forEach(item => {
      console.log(`  ${item.order}: ${item.label.th || item.label} → ${item.href}`);
    });

    // Find missions item to insert after it
    const missionsItem = navItems.find(item => item.href === '/missions');
    const orderAfterMissions = missionsItem ? missionsItem.order + 1 : 40;

    // Shift subsequent items
    const itemsToShift = await prisma.navigationItem.findMany({
      where: {
        order: { gte: orderAfterMissions }
      }
    });

    console.log(`\nShifting ${itemsToShift.length} items...`);
    for (const item of itemsToShift) {
      await prisma.navigationItem.update({
        where: { id: item.id },
        data: { order: item.order + 10 }
      });
    }

    // Create projects nav item
    const created = await prisma.navigationItem.create({
      data: {
        href: '/projects',
        label: {
          th: 'โครงการ',
          en: 'Projects'
        },
        order: orderAfterMissions,
        active: true
      }
    });

    console.log('\n✓ Successfully added projects navigation:');
    console.log(`  Order: ${created.order}`);
    console.log(`  Label: ${created.label.th}`);
    console.log(`  Href: ${created.href}`);

    // Show updated navigation
    const updated = await prisma.navigationItem.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });

    console.log('\nUpdated navigation order:');
    updated.forEach(item => {
      console.log(`  ${item.order}: ${item.label.th || item.label} → ${item.href}`);
    });

  } catch (error) {
    console.error('Error adding projects navigation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addProjectsNav();
