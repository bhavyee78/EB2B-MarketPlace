import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSalesmanUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('salesman123', 10);

    // Create the salesman user
    const salesman = await prisma.user.create({
      data: {
        email: 'salesman@premierdecor.com',
        passwordHash: hashedPassword,
        fullName: 'John Smith',
        phone: '+44 7700 900000',
        role: UserRole.SALESMAN,
        companyName: 'Premier Decorations Sales Team',
        locale: 'en',
      },
    });

    console.log('✅ Salesman user created successfully:');
    console.log({
      id: salesman.id,
      email: salesman.email,
      fullName: salesman.fullName,
      role: salesman.role,
    });

    // Create some sample leads for the salesman
    const sampleLeads = [
      {
        companyName: 'Garden Centre Paradise',
        contactName: 'Sarah Johnson',
        email: 'sarah@gardenparadise.co.uk',
        phone: '+44 7700 900001',
        industry: 'Garden Centre',
        companySize: '11-50',
        source: 'Website',
        estimatedValue: 5000,
        closeProbability: 80,
        expectedCloseDate: new Date('2024-12-15'),
        assignedToId: salesman.id,
      },
      {
        companyName: 'Festive Retail Ltd',
        contactName: 'Michael Brown',
        email: 'mike@festiveretail.com',
        phone: '+44 7700 900002',
        industry: 'Retail',
        companySize: '51-200',
        source: 'Cold Call',
        estimatedValue: 12000,
        closeProbability: 60,
        expectedCloseDate: new Date('2024-12-20'),
        assignedToId: salesman.id,
      },
      {
        companyName: 'Christmas Corner Shop',
        contactName: 'Emma Wilson',
        email: 'emma@christmascorner.co.uk',
        phone: '+44 7700 900003',
        industry: 'Specialty Store',
        companySize: '1-10',
        source: 'Referral',
        estimatedValue: 3500,
        closeProbability: 90,
        expectedCloseDate: new Date('2024-12-10'),
        assignedToId: salesman.id,
      },
    ];

    for (const leadData of sampleLeads) {
      await prisma.lead.create({
        data: leadData,
      });
    }

    console.log('✅ Sample leads created successfully');

    // Create some sample tasks
    const sampleTasks = [
      {
        title: 'Follow up with Garden Centre Paradise',
        description: 'Call to discuss Christmas wreath requirements',
        priority: 1,
        dueDate: new Date('2024-10-05'),
        assignedToId: salesman.id,
      },
      {
        title: 'Send catalog to Festive Retail',
        description: 'Email latest product catalog and pricing',
        priority: 2,
        dueDate: new Date('2024-10-03'),
        assignedToId: salesman.id,
      },
      {
        title: 'Schedule demo for Christmas Corner',
        description: 'Arrange product demonstration meeting',
        priority: 1,
        dueDate: new Date('2024-10-02'),
        assignedToId: salesman.id,
      },
    ];

    for (const taskData of sampleTasks) {
      await prisma.task.create({
        data: taskData,
      });
    }

    console.log('✅ Sample tasks created successfully');

    // Create sales targets
    const currentQuarter = '2024-Q4';
    const salesTargets = [
      {
        salesmanId: salesman.id,
        period: currentQuarter,
        targetType: 'revenue',
        targetValue: 50000,
        actualValue: 15000,
      },
      {
        salesmanId: salesman.id,
        period: currentQuarter,
        targetType: 'leads',
        targetValue: 20,
        actualValue: 8,
      },
      {
        salesmanId: salesman.id,
        period: currentQuarter,
        targetType: 'deals',
        targetValue: 10,
        actualValue: 3,
      },
    ];

    for (const targetData of salesTargets) {
      await prisma.salesTarget.create({
        data: targetData,
      });
    }

    console.log('✅ Sales targets created successfully');

    console.log('\n🎉 Setup complete! Use these credentials to login:');
    console.log('Email: salesman@premierdecor.com');
    console.log('Password: salesman123');

  } catch (error) {
    console.error('❌ Error creating salesman user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSalesmanUser();