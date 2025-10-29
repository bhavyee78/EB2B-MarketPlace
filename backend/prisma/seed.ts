import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Clear existing data
  await prisma.sale.deleteMany();
  await prisma.rfq.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.retailerOutlet.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create Admin Users
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@premier.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      fullName: 'Admin User',
      role: 'ADMIN',
      companyName: 'Premier Decorations Limited',
      phone: '+44 20 7946 0958',
    },
  });

  // Create Retailer Users
  const retailer1 = await prisma.user.create({
    data: {
      email: 'retailer1@example.com',
      passwordHash: await bcrypt.hash('retailer123', 10),
      fullName: 'John Smith',
      phone: '+44 20 1234 5678',
      role: 'RETAILER',
      companyName: 'Smith Garden Centre',
      outlets: {
        create: {
          outletName: 'Smith Store London',
          addressJson: {
            street: '123 High Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'UK',
          },
          vatNo: 'GB123456789',
          buyingGroup: 'Garden Centre Association',
        },
      },
    },
  });

  const retailer2 = await prisma.user.create({
    data: {
      email: 'retailer2@example.com',
      passwordHash: await bcrypt.hash('retailer123', 10),
      fullName: 'Sarah Johnson',
      phone: '+44 161 234 5678',
      role: 'RETAILER',
      companyName: 'Seasonal Decorations Ltd',
      outlets: {
        create: [
          {
            outletName: 'Manchester Decorations',
            addressJson: {
              street: '456 Market Street',
              city: 'Manchester',
              postcode: 'M1 1AA',
              country: 'UK',
            },
            vatNo: 'GB987654321',
          },
          {
            outletName: 'Birmingham Branch',
            addressJson: {
              street: '789 Bull Ring',
              city: 'Birmingham',
              postcode: 'B1 2AA',
              country: 'UK',
            },
            vatNo: 'GB987654321',
          },
        ],
      },
    },
  });

  console.log('👥 Created users and outlets');

  // Create Products
  const products = [
    // Christmas Collection
    {
      sku: 'XMAS-001',
      name: 'Winter Pine Wreath',
      description: 'Beautiful pine wreath with warm LED lights and festive red ribbon. Perfect for front doors and seasonal displays.',
      images: ['/christmas-collection.jpg', '/placeholder.jpg'],
      category: 'Wreaths',
      collection: 'Christmas',
      tags: ['Featured', 'Best Seller', 'LED Lights'],
      moq: 24,
      price: 7.50,
      packSize: '24 units per carton',
      leadTimeDays: 7,
      countriesBoughtIn: ['UK', 'IE', 'FR'],
      customizationOptions: ['Private label', 'Custom size', 'Ribbon color'],
      aiSuggestion: 'Hot selling in UK, IE - 85% repeat purchase rate',
    },
    {
      sku: 'XMAS-002',
      name: 'Snowberry Pine Wreath',
      description: 'Frosted pine wreath decorated with realistic snowberries and silver accents.',
      images: ['/christmas-collection.jpg'],
      category: 'Wreaths',
      collection: 'Christmas',
      tags: ['Must Try', 'New', 'Premium'],
      moq: 24,
      price: 8.75,
      packSize: '24 units per carton',
      leadTimeDays: 5,
      countriesBoughtIn: ['UK', 'FR', 'DE'],
      customizationOptions: ['Gift wrap', 'Custom tags'],
      aiSuggestion: 'Popular premium option - 40% higher margin',
    },
    {
      sku: 'XMAS-003',
      name: 'Christmas Tree Topper Star',
      description: 'Illuminated star tree topper with warm white LEDs and gold finish.',
      images: ['/christmas-collection.jpg'],
      category: 'Tree Toppers',
      collection: 'Christmas',
      tags: ['Featured', 'LED Lights'],
      moq: 36,
      price: 4.25,
      packSize: '36 units per carton',
      leadTimeDays: 10,
      countriesBoughtIn: ['UK', 'IE', 'NL'],
      customizationOptions: ['LED color', 'Finish options'],
      aiSuggestion: 'Essential Christmas item - steady demand',
    },
    {
      sku: 'XMAS-004',
      name: 'Festive Table Runner',
      description: 'Elegant Christmas table runner with holly pattern and gold threading.',
      images: ['/christmas-collection.jpg'],
      category: 'Table Decorations',
      collection: 'Christmas',
      tags: ['Featured', 'Elegant'],
      moq: 48,
      price: 3.50,
      packSize: '48 units per carton',
      leadTimeDays: 14,
      countriesBoughtIn: ['UK', 'IE'],
      customizationOptions: ['Size options', 'Pattern variations'],
      aiSuggestion: 'Growing demand for table accessories',
    },

    // Easter Collection
    {
      sku: 'EAST-001',
      name: 'Easter Basket Deluxe',
      description: 'Hand-woven natural wicker basket with pastel ribbon and decorative eggs.',
      images: ['/easter-collection.jpg'],
      category: 'Baskets',
      collection: 'Easter',
      tags: ['Featured', 'Handcrafted'],
      moq: 12,
      price: 15.99,
      packSize: '12 units per carton',
      leadTimeDays: 10,
      countriesBoughtIn: ['UK', 'DE', 'NL'],
      customizationOptions: ['Custom colors', 'Size options'],
      aiSuggestion: 'Premium Easter item with high margins',
    },
    {
      sku: 'EAST-002',
      name: 'Spring Flower Garland',
      description: 'Artificial spring flower garland with tulips, daffodils and green foliage.',
      images: ['/easter-collection.jpg'],
      category: 'Garlands',
      collection: 'Easter',
      tags: ['Spring', 'Colorful'],
      moq: 20,
      price: 6.75,
      packSize: '20 units - 2m length each',
      leadTimeDays: 8,
      countriesBoughtIn: ['UK', 'NL', 'BE'],
      customizationOptions: ['Length options', 'Flower mix'],
      aiSuggestion: 'Versatile spring decoration',
    },
    {
      sku: 'EAST-003',
      name: 'Bunny Door Hanger',
      description: 'Cute wooden bunny door hanger with welcome message and pastel finish.',
      images: ['/easter-collection.jpg'],
      category: 'Door Hangers',
      collection: 'Easter',
      tags: ['Cute', 'Wooden'],
      moq: 30,
      price: 4.99,
      packSize: '30 units per carton',
      leadTimeDays: 12,
      countriesBoughtIn: ['UK', 'IE'],
      customizationOptions: ['Message text', 'Paint colors'],
      aiSuggestion: 'Popular with families and children',
    },

    // Autumn Collection
    {
      sku: 'AUT-001',
      name: 'Autumn Leaf Garland',
      description: 'Realistic autumn leaf garland in warm reds, oranges and yellows.',
      images: ['/autumn-collection.jpg'],
      category: 'Garlands',
      collection: 'Autumn',
      tags: ['Top Deals', 'Natural Look'],
      moq: 20,
      price: 8.25,
      packSize: '20 units - 3m length each',
      leadTimeDays: 7,
      countriesBoughtIn: ['UK', 'NL', 'FR'],
      customizationOptions: ['Length options', 'Leaf mix'],
      aiSuggestion: 'Strong autumn seller - order early',
    },
    {
      sku: 'AUT-002',
      name: 'Harvest Pumpkin Set',
      description: 'Set of 3 decorative pumpkins in different sizes with natural stems.',
      images: ['/autumn-collection.jpg'],
      category: 'Pumpkins',
      collection: 'Autumn',
      tags: ['Set', 'Natural'],
      moq: 24,
      price: 12.50,
      packSize: '8 sets per carton (24 pumpkins)',
      leadTimeDays: 9,
      countriesBoughtIn: ['UK', 'DE'],
      customizationOptions: ['Size variations', 'Color options'],
      aiSuggestion: 'Perfect for harvest displays',
    },
    {
      sku: 'AUT-003',
      name: 'Fall Welcome Sign',
      description: 'Rustic wooden welcome sign with autumn motifs and warm colors.',
      images: ['/autumn-collection.jpg'],
      category: 'Signs',
      collection: 'Autumn',
      tags: ['Rustic', 'Welcome'],
      moq: 18,
      price: 14.99,
      packSize: '18 units per carton',
      leadTimeDays: 15,
      countriesBoughtIn: ['UK', 'IE'],
      customizationOptions: ['Text options', 'Size variations'],
      aiSuggestion: 'High-margin decorative signage',
    },
  ];

  for (const productData of products) {
    await prisma.product.create({ data: productData });
  }

  console.log('🎄 Created products');

  // Get created products and users
  const allProducts = await prisma.product.findMany();
  const christmasProducts = allProducts.filter(p => p.collection === 'Christmas');
  const featuredProducts = allProducts.filter(p => p.tags && JSON.stringify(p.tags).includes('Featured'));

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      userId: retailer1.id,
      orderNumber: 'PO-2024-001',
      status: 'CONFIRMED',
      currency: 'GBP',
      totalAmount: 485.75,
      placedAt: new Date('2024-08-15'),
      items: {
        create: [
          {
            productId: christmasProducts[0].id,
            quantity: 48,
            unitPrice: 7.50,
            moqAtOrder: 24,
            initialPcQuantity: 0,
            initialCsQuantity: 2,
            netQuantity: 48,
            initialAmount: 360.00,
            billAmount: 360.00,
            netAmount: 360.00,
          },
          {
            productId: christmasProducts[1].id,
            quantity: 24,
            unitPrice: 8.75,
            moqAtOrder: 24,
            initialPcQuantity: 24,
            initialCsQuantity: 0,
            netQuantity: 24,
            initialAmount: 210.00,
            billAmount: 210.00,
            netAmount: 210.00,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: retailer2.id,
      orderNumber: 'PO-2024-002',
      status: 'PENDING',
      currency: 'GBP',
      totalAmount: 756.25,
      placedAt: new Date('2024-08-20'),
      items: {
        create: [
          {
            productId: allProducts[4].id, // Easter basket
            quantity: 24,
            unitPrice: 15.99,
            moqAtOrder: 12,
            initialPcQuantity: 24,
            initialCsQuantity: 0,
            netQuantity: 24,
            initialAmount: 383.76,
            billAmount: 383.76,
            netAmount: 383.76,
          },
          {
            productId: allProducts[7].id, // Autumn garland
            quantity: 40,
            unitPrice: 8.25,
            moqAtOrder: 20,
            initialPcQuantity: 40,
            initialCsQuantity: 0,
            netQuantity: 40,
            initialAmount: 330.00,
            billAmount: 330.00,
            netAmount: 330.00,
          },
        ],
      },
    },
  });

  console.log('📦 Created orders');

  // Create sample RFQs
  await prisma.rfq.createMany({
    data: [
      {
        userId: retailer1.id,
        productId: featuredProducts[0].id,
        requestedQty: 100,
        status: 'OPEN',
        note: 'Need competitive pricing for large Christmas order. Planning early for holiday season.',
      },
      {
        userId: retailer2.id,
        productId: featuredProducts[1].id,
        requestedQty: 75,
        status: 'QUOTED',
        note: 'Looking for Easter 2025 pricing. Regular customer with good payment history.',
        quotationUrl: '/quotes/rfq-002-quote.pdf',
      },
      {
        userId: retailer1.id,
        productId: allProducts[8].id, // Autumn item
        requestedQty: 60,
        status: 'ACCEPTED',
        note: 'Urgent order for autumn season. Existing customer.',
      },
    ],
  });

  console.log('📋 Created RFQs');

  // Create comprehensive sales data
  const salesData = [];
  const months = [-5, -4, -3, -2, -1, 0]; // Last 6 months
  const countries = ['UK', 'IE', 'FR', 'DE', 'NL', 'BE'];

  for (const product of allProducts) {
    for (const monthOffset of months) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthOffset);
      
      // Generate realistic sales based on product collection and seasonality
      let baseSales = 50;
      let baseRevenue = 2000;
      
      // Seasonal adjustments
      const month = date.getMonth();
      if (product.collection === 'Christmas' && (month === 10 || month === 11)) {
        baseSales *= 3; // Higher sales in Nov/Dec
        baseRevenue *= 3;
      } else if (product.collection === 'Easter' && (month === 2 || month === 3)) {
        baseSales *= 2; // Higher sales in Mar/Apr
        baseRevenue *= 2;
      } else if (product.collection === 'Autumn' && (month === 8 || month === 9)) {
        baseSales *= 2.5; // Higher sales in Sep/Oct
        baseRevenue *= 2.5;
      }

      // Add some randomness
      const salesVariation = 0.3 + Math.random() * 0.4; // 0.3 to 0.7 multiplier
      const units = Math.floor(baseSales * salesVariation);
      const revenue = Math.floor(baseRevenue * salesVariation);

      // Create sales for random countries
      const numCountries = Math.floor(Math.random() * 3) + 1; // 1-3 countries
      const selectedCountries = countries.slice(0, numCountries);

      for (const country of selectedCountries) {
        salesData.push({
          productId: product.id,
          country,
          period: date,
          unitsSold: Math.floor(units / numCountries),
          revenue: Math.floor(revenue / numCountries),
        });
      }
    }
  }

  await prisma.sale.createMany({ data: salesData });

  console.log('📊 Created sales data');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('Admin: admin@premier.com / admin123');
  console.log('Retailer 1: retailer1@example.com / retailer123');
  console.log('Retailer 2: retailer2@example.com / retailer123');
  console.log('');
  console.log('📈 Data created:');
  console.log(`- ${await prisma.user.count()} users`);
  console.log(`- ${await prisma.product.count()} products`);
  console.log(`- ${await prisma.order.count()} orders`);
  console.log(`- ${await prisma.rfq.count()} RFQs`);
  console.log(`- ${await prisma.sale.count()} sales records`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });