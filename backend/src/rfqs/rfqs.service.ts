import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RfqsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.rfq.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.rfq.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        product: true,
      },
    });

    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    if (user.role !== 'ADMIN' && rfq.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return rfq;
  }

  async create(dto: any, userId: string) {
    return this.prisma.rfq.create({
      data: {
        userId,
        productId: dto.productId,
        requestedQty: dto.requestedQty,
        note: dto.note,
      },
      include: {
        product: true,
      },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.rfq.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        product: true,
      },
    });
  }
}