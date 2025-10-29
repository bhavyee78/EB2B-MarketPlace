const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get some product IDs for free item offers
    const products = await prisma.product.findMany({
      take: 5,
      select: { id: true, name: true, sku: true }
    });

    console.log('Found products:', products.map(p => ({ id: p.id, name: p.name, sku: p.sku })));

    // Get admin user for createdByUserId
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('No admin user found, creating one...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@premier.com',
          passwordHash: hashedPassword,
          fullName: 'Admin User',
          role: 'ADMIN',
        }
      });
      console.log('Created admin user:', newAdmin.id);
      adminUser = newAdmin;
    }

    console.log('Using admin user:', adminUser.id);

    // Clear existing offers
    await prisma.offerScopeProduct.deleteMany({});
    await prisma.offerScopeCategory.deleteMany({});
    await prisma.offerScopeCollection.deleteMany({});
    await prisma.offer.deleteMany({});

    console.log('Cleared existing offers');

    // Create relevant offers
    const offers = [
      // 1. Christmas Collection 15% Off
      {
        name: 'Christmas Collection 15% Off',
        description: 'Get 15% off all Christmas decorations - perfect for holiday stocking!',
        type: 'PERCENT_OFF',
        percentOff: 15,
        startsAt: new Date('2025-11-01'),
        endsAt: new Date('2025-12-31'),
        minQuantity: 0,
        priority: 10,
        isStackable: false,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          collections: ['Christmas']
        }
      },

      // 2. Bulk Order Discount - £20 off orders over £200
      {
        name: 'Bulk Order Discount',
        description: 'Save £20 on orders over £200 - perfect for retailers stocking up',
        type: 'AMOUNT_OFF',
        amountOff: 20,
        minQuantity: 0,
        minOrderAmount: 200,
        priority: 5,
        isStackable: true,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          categories: ['Garlands', 'Wreaths', 'Door Hangers']
        }
      },

      // 3. Buy 2 Garlands Get 1 Free
      {
        name: 'Buy 2 Garlands Get 1 Free',
        description: 'Purchase 2 garlands and get a third one absolutely free!',
        type: 'FREE_ITEM',
        freeItemProductId: products[0]?.id, // Using first product as free item
        freeItemQty: 1,
        minQuantity: 2,
        appliesToAnyQty: false,
        priority: 8,
        isStackable: false,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          categories: ['Garlands']
        }
      },

      // 4. Easter Early Bird 10% Off
      {
        name: 'Easter Early Bird Special',
        description: 'Early bird special - 10% off Easter collection for spring preparation',
        type: 'PERCENT_OFF',
        percentOff: 10,
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-04-30'),
        minQuantity: 20,
        priority: 7,
        isStackable: true,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          collections: ['Easter']
        }
      },

      // 5. Autumn Clearance - 25% Off
      {
        name: 'Autumn Clearance Sale',
        description: 'End of season clearance - 25% off all autumn decorations',
        type: 'PERCENT_OFF',
        percentOff: 25,
        startsAt: new Date('2025-11-15'),
        endsAt: new Date('2025-12-15'),
        minQuantity: 0,
        priority: 12,
        isStackable: false,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          collections: ['Autumn']
        }
      },

      // 6. Signs & Door Hangers Bundle Deal
      {
        name: 'Welcome Signs Bundle',
        description: 'Special pricing on welcome signs and door hangers - £5 off orders of 50+ units',
        type: 'AMOUNT_OFF',
        amountOff: 5,
        minQuantity: 50,
        appliesToAnyQty: true,
        priority: 6,
        isStackable: true,
        isActive: true,
        createdByUserId: adminUser.id,
        scopes: {
          categories: ['Signs', 'Door Hangers']
        }
      }
    ];

    console.log('Creating offers...');

    for (const offerData of offers) {
      const { scopes, ...mainOfferData } = offerData;
      
      // Create the main offer
      const offer = await prisma.offer.create({
        data: mainOfferData
      });

      console.log(`Created offer: ${offer.name} (${offer.id})`);

      // Create scope relationships
      if (scopes.collections) {
        for (const collection of scopes.collections) {
          await prisma.offerScopeCollection.create({
            data: {
              offerId: offer.id,
              collection: collection
            }
          });
          console.log(`  - Added collection scope: ${collection}`);
        }
      }

      if (scopes.categories) {
        for (const category of scopes.categories) {
          await prisma.offerScopeCategory.create({
            data: {
              offerId: offer.id,
              category: category
            }
          });
          console.log(`  - Added category scope: ${category}`);
        }
      }

      if (scopes.products) {
        for (const productId of scopes.products) {
          await prisma.offerScopeProduct.create({
            data: {
              offerId: offer.id,
              productId: productId
            }
          });
          console.log(`  - Added product scope: ${productId}`);
        }
      }
    }

    console.log('✅ Successfully created dummy offers!');

    // Verify by fetching all offers
    const createdOffers = await prisma.offer.findMany({
      include: {
        scopesProducts: {
          include: {
            product: {
              select: { name: true, sku: true }
            }
          }
        },
        scopesCategories: true,
        scopesCollections: true,
        freeItemProduct: {
          select: { name: true, sku: true }
        }
      }
    });

    console.log(`\n📊 Created ${createdOffers.length} offers:`);
    createdOffers.forEach(offer => {
      console.log(`- ${offer.name} (${offer.type})`);
      if (offer.scopesCollections.length > 0) {
        console.log(`  Collections: ${offer.scopesCollections.map(s => s.collection).join(', ')}`);
      }
      if (offer.scopesCategories.length > 0) {
        console.log(`  Categories: ${offer.scopesCategories.map(s => s.category).join(', ')}`);
      }
      if (offer.scopesProducts.length > 0) {
        console.log(`  Products: ${offer.scopesProducts.map(s => s.product.name).join(', ')}`);
      }
    });

  } catch (error) {
    console.error('Error creating dummy offers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();