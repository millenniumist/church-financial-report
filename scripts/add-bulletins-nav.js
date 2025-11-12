const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addBulletinsNav() {
  try {
    // Check if bulletins nav already exists
    const existing = await prisma.navigationItem.findFirst({
      where: { href: '/bulletins' }
    });

    if (existing) {
      console.log('✓ Bulletins navigation already exists:', existing);
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

    // Find contact item to insert before it (bulletins should be after financial)
    const contactItem = navItems.find(item => item.href === '/contact');
    const orderBeforeContact = contactItem ? contactItem.order - 5 : 65;

    // Create bulletins nav item
    const created = await prisma.navigationItem.create({
      data: {
        href: '/bulletins',
        label: {
          th: 'สูจิบัตร',
          en: 'Bulletins'
        },
        order: orderBeforeContact,
        active: true
      }
    });

    console.log('\n✓ Successfully added bulletins navigation:');
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
    console.error('Error adding bulletins navigation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addBulletinsNav();
