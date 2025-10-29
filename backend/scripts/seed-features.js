const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting feature seed data...');

  // Sample feature values
  const features = [
    'Fast Selling',
    'Must Buy',
    'Top Choice',
    'Best Value',
    'Premium Quality'
  ];

  // First, update some existing products with feature tags
  const products = await prisma.product.findMany({
    take: 20,
    where: { status: 'ACTIVE' }
  });

  console.log(`Found ${products.length} products to update with features...`);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const featureIndex = i % features.length;
    const feature = features[featureIndex];

    await prisma.product.update({
      where: { id: product.id },
      data: { feature }
    });

    console.log(`Updated ${product.name} with feature: ${feature}`);
  }

  // Create feature priorities
  console.log('Creating feature priorities...');
  
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    
    await prisma.featurePriority.upsert({
      where: { feature },
      update: {
        priority: i + 1,
        isActive: true
      },
      create: {
        feature,
        priority: i + 1,
        isActive: true
      }
    });

    console.log(`Created/updated priority for feature: ${feature} (priority: ${i + 1})`);
  }

  console.log('Feature seed data completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });