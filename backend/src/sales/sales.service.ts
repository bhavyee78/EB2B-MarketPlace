import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getKpis(period: string = 'last30d') {
    const startDate = this.getStartDate(period);
    
    const [gmv, orderCount, topProducts, topRetailers] = await Promise.all([
      this.calculateGmv(startDate),
      this.getOrderCount(startDate),
      this.getTopProducts(startDate),
      this.getTopRetailers(startDate),
    ]);

    const aov = orderCount > 0 ? gmv / orderCount : 0;

    return {
      gmv,
      orders: orderCount,
      aov,
      topProducts,
      topRetailers,
    };
  }

  private async calculateGmv(startDate: Date) {
    const result = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        placedAt: { gte: startDate },
        status: { in: ['CONFIRMED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'] },
      },
    });
    return Number(result._sum.totalAmount || 0);
  }

  private async getOrderCount(startDate: Date) {
    return this.prisma.order.count({
      where: {
        placedAt: { gte: startDate },
        status: { in: ['CONFIRMED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'] },
      },
    });
  }

  private async getTopProducts(startDate: Date) {
    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { netQuantity: true, netAmount: true },
      where: {
        order: {
          placedAt: { gte: startDate },
          status: { in: ['CONFIRMED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'] },
        },
      },
      orderBy: { _sum: { netAmount: 'desc' } },
      take: 5,
    });

    const productIds = orderItems.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    return orderItems.map(orderItem => {
      const product = products.find(p => p.id === orderItem.productId);
      return {
        product,
        unitsSold: orderItem._sum.netQuantity || 0,
        revenue: Number(orderItem._sum.netAmount || 0),
      };
    });
  }

  private async getTopRetailers(startDate: Date) {
    const orders = await this.prisma.order.groupBy({
      by: ['userId'],
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        placedAt: { gte: startDate },
        status: { in: ['CONFIRMED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'] },
      },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    const userIds = orders.map(order => order.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });

    return orders.map(order => {
      const user = users.find(u => u.id === order.userId);
      return {
        retailer: user,
        totalSpent: Number(order._sum.totalAmount || 0),
        orderCount: order._count.id,
      };
    });
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'last7d':
        return new Date(now.setDate(now.getDate() - 7));
      case 'last30d':
        return new Date(now.setDate(now.getDate() - 30));
      case 'last90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }
}