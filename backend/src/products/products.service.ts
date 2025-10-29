import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { search, category, collection, tag, feature, limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    let where: any = {
      status: 'ACTIVE',
      ...(category && { category }),
      ...(collection && { collection }),
      ...(feature && { feature }),
    };

    // Handle search
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build order by clause
    const getOrderByClause = () => {
      switch (sortBy) {
        case 'name':
          return { name: sortOrder };
        case 'price':
          return { price: sortOrder };
        case 'createdAt':
        default:
          return { createdAt: sortOrder };
      }
    };

    // Handle tag filtering with raw SQL for MySQL JSON
    let products, total;
    if (tag) {
      // Build sort clause for raw SQL
      const getSortClause = () => {
        switch (sortBy) {
          case 'name':
            return `name ${sortOrder.toUpperCase()}`;
          case 'price':
            return `price ${sortOrder.toUpperCase()}`;
          case 'createdAt':
          default:
            return `created_at ${sortOrder.toUpperCase()}`;
        }
      };

      // Use raw query for JSON tag filtering
      const tagQuery = `
        SELECT 
          id, sku, name, description, images, category, collection, tags, feature, moq, price,
          pack_size as packSize, lead_time_days as leadTimeDays, 
          countries_bought_in as countriesBoughtIn, customization_options as customizationOptions,
          status, ai_suggestion as aiSuggestion, created_at as createdAt, updated_at as updatedAt
        FROM products 
        WHERE status = 'ACTIVE'
        ${category ? `AND category = '${category}'` : ''}
        ${collection ? `AND collection = '${collection}'` : ''}
        ${feature ? `AND feature = '${feature}'` : ''}
        ${search ? `AND (name LIKE '%${search}%' OR description LIKE '%${search}%')` : ''}
        AND JSON_CONTAINS(tags, '"${tag}"')
        ORDER BY ${getSortClause()}
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = `
        SELECT COUNT(*) as count FROM products 
        WHERE status = 'ACTIVE'
        ${category ? `AND category = '${category}'` : ''}
        ${collection ? `AND collection = '${collection}'` : ''}
        ${feature ? `AND feature = '${feature}'` : ''}
        ${search ? `AND (name LIKE '%${search}%' OR description LIKE '%${search}%')` : ''}
        AND JSON_CONTAINS(tags, '"${tag}"')
      `;

      products = await this.prisma.$queryRawUnsafe(tagQuery);
      const [countResult] = await this.prisma.$queryRawUnsafe(countQuery) as any[];
      total = Number(countResult.count);
    } else {
      [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: getOrderByClause(),
        }),
        this.prisma.product.count({ where }),
      ]);
    }

    return {
      products,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sales: {
          take: 30,
          orderBy: { period: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const aiSuggestion = this.generateAiSuggestion(dto);
    
    return this.prisma.product.create({
      data: {
        ...dto,
        aiSuggestion,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async getUniqueCollections() {
    const collections = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { collection: true },
      distinct: ['collection'],
    });

    return collections
      .filter(p => p.collection)
      .map(p => p.collection);
  }

  async getUniqueCategories() {
    const categories = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true },
      distinct: ['category'],
    });

    return categories
      .filter(p => p.category)
      .map(p => p.category);
  }

  private generateAiSuggestion(product: any): string {
    const suggestions = [
      `Hot selling in ${product.countriesBoughtIn?.join(', ') || 'UK, IE'}`,
      `${product.moq} units minimum order`,
      `Popular for ${product.collection} season`,
      `Best seller in ${product.category}`,
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}