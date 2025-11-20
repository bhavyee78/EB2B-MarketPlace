import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: any) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getFirstUser() {
    return this.prisma.user.findFirst();
  }

  async create(dto: any, userId: string) {
    console.log('Creating order for user:', userId);
    console.log('Order DTO:', JSON.stringify(dto, null, 2));

    const orderNumber = `ORD-${Date.now()}`;

    // Group cart items by productId to consolidate PC and CS quantities
    const consolidatedItems = new Map();
    
    for (const item of dto.items) {
      const key = item.productId;
      
      if (consolidatedItems.has(key)) {
        const existing = consolidatedItems.get(key);
        
        // Add quantities based on type
        if (item.type === 'pc') {
          existing.initialPcQuantity += item.quantity;
          existing.initialPcAmount += item.unitPrice * item.quantity;
        } else if (item.type === 'cs') {
          existing.initialCsQuantity += item.quantity;
          existing.initialCsAmount += item.unitPrice * item.quantity;
        }
        
        consolidatedItems.set(key, existing);
      } else {
        // Get product details to calculate pieces in a case
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { csQuantity: true, moq: true },
        });
        
        const piecesPerCase = product?.csQuantity || 1;
        
        consolidatedItems.set(key, {
          productId: item.productId,
          initialPcQuantity: item.type === 'pc' ? item.quantity : 0,
          initialCsQuantity: item.type === 'cs' ? item.quantity : 0,
          initialPcAmount: item.type === 'pc' ? item.unitPrice * item.quantity : 0,
          initialCsAmount: item.type === 'cs' ? item.unitPrice * item.quantity : 0,
          piecesPerCase: piecesPerCase,
          moqAtOrder: product?.moq || item.moq || 1,
        });
      }
    }
    
    // Calculate discount distribution if offers are applied
    const totalDiscount = dto.totalDiscount || 0;
    const originalAmount = dto.originalAmount || 0;
    
    // Process consolidated items and calculate totals
    const processedItems = [];
    let orderInitialAmount = 0;
    let orderBillAmount = 0;
    let orderNetAmount = 0;
    
    for (const consolidated of consolidatedItems.values()) {
      // Calculate net quantity in pieces
      const netQuantity = consolidated.initialPcQuantity + (consolidated.initialCsQuantity * consolidated.piecesPerCase);
      
      // Calculate amounts
      const initialAmount = consolidated.initialPcAmount + consolidated.initialCsAmount;
      
      // Apply discount proportionally if there's a total discount
      let billAmount = initialAmount;
      if (totalDiscount > 0 && originalAmount > 0) {
        // Calculate this item's proportion of the total original amount
        const itemProportion = initialAmount / originalAmount;
        // Apply the proportional discount to this item
        const itemDiscount = totalDiscount * itemProportion;
        billAmount = Math.max(0, initialAmount - itemDiscount);
      }
      
      const netAmount = billAmount; // No additional add-ons for now
      
      // For legacy compatibility, store net quantity as quantity and average price as unit price
      const unitPrice = netQuantity > 0 ? initialAmount / netQuantity : 0;
      
      processedItems.push({
        productId: consolidated.productId,
        initialPcQuantity: consolidated.initialPcQuantity,
        initialCsQuantity: consolidated.initialCsQuantity,
        netQuantity: netQuantity,
        initialAmount: initialAmount,
        billAmount: billAmount,
        netAmount: netAmount,
        quantity: netQuantity, // Legacy field
        unitPrice: unitPrice, // Legacy field - average price per piece
        moqAtOrder: consolidated.moqAtOrder,
      });
      
      orderInitialAmount += initialAmount;
      orderBillAmount += billAmount;
      orderNetAmount += netAmount;
    }
    
    // Prepare addOns data to include offer information
    const addOnsData: any = {};
    if (dto.appliedOffers) {
      addOnsData.appliedOffers = dto.appliedOffers;
    }
    if (dto.freeItems) {
      addOnsData.freeItems = dto.freeItems;
    }
    if (dto.totalDiscount !== undefined) {
      addOnsData.totalDiscount = dto.totalDiscount;
    }
    if (dto.originalAmount !== undefined) {
      addOnsData.originalAmount = dto.originalAmount;
    }

    return this.prisma.order.create({
      data: {
        userId,
        orderNumber,
        status: 'PENDING',
        totalAmount: orderNetAmount, // Legacy field - final amount after discounts
        initialAmount: orderInitialAmount,
        billAmount: orderBillAmount, // Amount after discounts
        netAmount: orderNetAmount, // Same as bill amount (no additional add-ons)
        currency: 'GBP',
        placedAt: new Date(),
        addOns: addOnsData,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });
  }

  async update(id: string, dto: any, userId: string) {
    return this.prisma.order.update({
      where: { id, userId },
      data: dto,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // Admin methods
  async findAllForAdmin(query: any) {
    const { status, startDate, endDate, limit = 50, offset = 0 } = query;
    const numLimit = parseInt(limit.toString());
    const numOffset = parseInt(offset.toString());
    
    const where: any = {};
    if (status) where.status = status;
    if (startDate || endDate) {
      where.placedAt = {};
      if (startDate) where.placedAt.gte = new Date(startDate);
      if (endDate) where.placedAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true,
            },
          },
        },
        orderBy: { placedAt: 'desc' },
        take: numLimit,
        skip: numOffset,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      limit,
      offset,
    };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            companyName: true,
          },
        },
      },
    });
  }
}