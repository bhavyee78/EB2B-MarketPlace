import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, OfferType } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { QueryOffersDto, ApplicableOffersDto, CartItemDto } from './dto/query-offers.dto';

export interface OfferCalculationResult {
  offerId: string;
  offerName: string;
  type: OfferType;
  discount: number;
  freeItems?: {
    productId: string;
    quantity: number;
  }[];
}

export interface CartCalculationResult {
  applicableOffers: OfferCalculationResult[];
  totalDiscount: number;
  finalAmount: number;
  originalAmount: number;
  freeItems: {
    productId: string;
    quantity: number;
  }[];
}

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(createOfferDto: CreateOfferDto, createdByUserId: string) {
    // Validate offer type specific fields
    this.validateOfferTypeFields(createOfferDto);

    const { scopes, ...offerData } = createOfferDto;

    // Create the offer with transaction
    const offer = await this.prisma.$transaction(async (tx) => {
      const newOffer = await tx.offer.create({
        data: {
          ...offerData,
          createdByUserId,
          startsAt: offerData.startsAt ? new Date(offerData.startsAt) : null,
          endsAt: offerData.endsAt ? new Date(offerData.endsAt) : null,
        },
      });

      // Create scopes
      if (scopes.products?.length) {
        await tx.offerScopeProduct.createMany({
          data: scopes.products.map(productId => ({
            offerId: newOffer.id,
            productId,
          })),
        });
      }

      if (scopes.categories?.length) {
        await tx.offerScopeCategory.createMany({
          data: scopes.categories.map(category => ({
            offerId: newOffer.id,
            category,
          })),
        });
      }

      if (scopes.collections?.length) {
        await tx.offerScopeCollection.createMany({
          data: scopes.collections.map(collection => ({
            offerId: newOffer.id,
            collection,
          })),
        });
      }

      return newOffer;
    });

    return this.findOne(offer.id);
  }

  async findAll(queryDto: QueryOffersDto) {
    const { page = 1, limit = 10, type, isActive, startDate, endDate, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) where.type = type;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({
          OR: [
            { startsAt: null },
            { startsAt: { gte: new Date(startDate) } },
          ],
        });
      }
      if (endDate) {
        where.AND.push({
          OR: [
            { endsAt: null },
            { endsAt: { lte: new Date(endDate) } },
          ],
        });
      }
    }

    const [offers, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          scopesProducts: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
          scopesCategories: true,
          scopesCollections: true,
          freeItemProduct: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.offer.count({ where }),
    ]);

    return {
      data: offers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        scopesProducts: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
        scopesCategories: true,
        scopesCollections: true,
        freeItemProduct: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  async update(id: string, updateOfferDto: UpdateOfferDto) {
    const existingOffer = await this.findOne(id);
    
    if ('type' in updateOfferDto && updateOfferDto.type) {
      this.validateOfferTypeFields(updateOfferDto);
    }

    const { scopes, ...offerData } = updateOfferDto as any;

    const updatedOffer = await this.prisma.$transaction(async (tx) => {
      // Update the offer
      const offer = await tx.offer.update({
        where: { id },
        data: {
          ...offerData,
          ...(offerData.startsAt && { startsAt: new Date(offerData.startsAt) }),
          ...(offerData.endsAt && { endsAt: new Date(offerData.endsAt) }),
        },
      });

      // Update scopes if provided
      if (scopes) {
        // Delete existing scopes
        await Promise.all([
          tx.offerScopeProduct.deleteMany({ where: { offerId: id } }),
          tx.offerScopeCategory.deleteMany({ where: { offerId: id } }),
          tx.offerScopeCollection.deleteMany({ where: { offerId: id } }),
        ]);

        // Create new scopes
        if (scopes.products?.length) {
          await tx.offerScopeProduct.createMany({
            data: scopes.products.map(productId => ({
              offerId: id,
              productId,
            })),
          });
        }

        if (scopes.categories?.length) {
          await tx.offerScopeCategory.createMany({
            data: scopes.categories.map(category => ({
              offerId: id,
              category,
            })),
          });
        }

        if (scopes.collections?.length) {
          await tx.offerScopeCollection.createMany({
            data: scopes.collections.map(collection => ({
              offerId: id,
              collection,
            })),
          });
        }
      }

      return offer;
    });

    return this.findOne(updatedOffer.id);
  }

  async remove(id: string) {
    const offer = await this.findOne(id);
    await this.prisma.offer.delete({ where: { id } });
    return { message: 'Offer deleted successfully' };
  }

  async findApplicableOffers(queryDto: ApplicableOffersDto) {
    const now = new Date();
    const baseWhere = {
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
    };

    let offers = [];

    if (queryDto.cartItems?.length) {
      // Cart-based query
      offers = await this.getOffersForCart(queryDto.cartItems, baseWhere);
    } else {
      // Individual product/category/collection query
      offers = await this.getOffersForContext(queryDto, baseWhere);
    }

    return offers.sort((a, b) => b.priority - a.priority);
  }

  async calculateCartOffers(cartItems: CartItemDto[]): Promise<CartCalculationResult> {
    const applicableOffers = await this.findApplicableOffers({ cartItems });
    const originalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Get product details for cart items
    const productIds = cartItems.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true, collection: true },
    });

    const productMap = new Map(products.map(p => [p.id, p]));
    
    let totalDiscount = 0;
    const freeItems: { productId: string; quantity: number }[] = [];
    const appliedOffers: OfferCalculationResult[] = [];

    for (const offer of applicableOffers) {
      if (!this.canApplyOffer(offer, cartItems, productMap)) continue;

      const result = this.calculateOfferDiscount(offer, cartItems, productMap);
      
      if (result.discount > 0 || result.freeItems?.length) {
        if (!offer.isStackable && appliedOffers.length > 0) {
          // If not stackable and we already have offers, skip lower priority ones
          break;
        }

        appliedOffers.push(result);
        totalDiscount += result.discount;
        
        if (result.freeItems?.length) {
          freeItems.push(...result.freeItems);
        }

        if (!offer.isStackable) {
          // If this offer is not stackable, don't apply any more offers
          break;
        }
      }
    }

    return {
      applicableOffers: appliedOffers,
      totalDiscount,
      originalAmount,
      finalAmount: Math.max(0, originalAmount - totalDiscount),
      freeItems,
    };
  }

  private validateOfferTypeFields(dto: any) {
    if (dto.type === OfferType.PERCENT_OFF && (!dto.percentOff || dto.percentOff <= 0)) {
      throw new BadRequestException('Percent off value is required for PERCENT_OFF offers');
    }

    if (dto.type === OfferType.AMOUNT_OFF && (!dto.amountOff || dto.amountOff <= 0)) {
      throw new BadRequestException('Amount off value is required for AMOUNT_OFF offers');
    }

    if (dto.type === OfferType.FREE_ITEM && !dto.freeItemProductId) {
      throw new BadRequestException('Free item product ID is required for FREE_ITEM offers');
    }
  }

  private async getOffersForCart(cartItems: CartItemDto[], baseWhere: any) {
    const productIds = cartItems.map(item => item.productId);
    
    // Get product details to check categories and collections
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true, collection: true },
    });

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const collections = [...new Set(products.map(p => p.collection).filter(Boolean))];

    return this.prisma.offer.findMany({
      where: {
        ...baseWhere,
        OR: [
          { scopesProducts: { some: { productId: { in: productIds } } } },
          { scopesCategories: { some: { category: { in: categories } } } },
          { scopesCollections: { some: { collection: { in: collections } } } },
        ],
      },
      include: {
        scopesProducts: { include: { product: true } },
        scopesCategories: true,
        scopesCollections: true,
        freeItemProduct: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  private async getOffersForContext(queryDto: ApplicableOffersDto, baseWhere: any) {
    const orConditions = [];

    // If searching by productId, also fetch the product to get its collection and category
    let productDetails = null;
    if (queryDto.productId) {
      // Add direct product-scoped offers
      orConditions.push({ scopesProducts: { some: { productId: queryDto.productId } } });
      
      // Fetch product details to check for collection and category offers
      productDetails = await this.prisma.product.findUnique({
        where: { id: queryDto.productId },
        select: { category: true, collection: true },
      });
    }

    // Add collection-scoped offers
    const collections = [];
    if (queryDto.collection) {
      collections.push(queryDto.collection);
    }
    if (productDetails?.collection) {
      collections.push(productDetails.collection);
    }
    if (collections.length > 0) {
      orConditions.push({ scopesCollections: { some: { collection: { in: collections } } } });
    }

    // Add category-scoped offers
    const categories = [];
    if (queryDto.category) {
      categories.push(queryDto.category);
    }
    if (productDetails?.category) {
      categories.push(productDetails.category);
    }
    if (categories.length > 0) {
      orConditions.push({ scopesCategories: { some: { category: { in: categories } } } });
    }

    if (orConditions.length === 0) {
      return [];
    }

    return this.prisma.offer.findMany({
      where: {
        ...baseWhere,
        OR: orConditions,
      },
      include: {
        scopesProducts: { include: { product: true } },
        scopesCategories: true,
        scopesCollections: true,
        freeItemProduct: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  private canApplyOffer(offer: any, cartItems: CartItemDto[], productMap: Map<string, any>): boolean {
    // Check minimum quantity
    if (offer.minQuantity > 0) {
      const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty < offer.minQuantity) return false;
    }

    // Check minimum order amount
    if (offer.minOrderAmount) {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      if (totalAmount < offer.minOrderAmount) return false;
    }

    // Check if offer applies to any items in cart
    const applicableItems = this.getApplicableCartItems(offer, cartItems, productMap);
    return applicableItems.length > 0;
  }

  private getApplicableCartItems(offer: any, cartItems: CartItemDto[], productMap: Map<string, any>): CartItemDto[] {
    return cartItems.filter(item => {
      const product = productMap.get(item.productId);
      if (!product) return false;

      // Check if product is in scope
      const inProductScope = offer.scopesProducts.some((scope: any) => scope.productId === item.productId);
      const inCategoryScope = offer.scopesCategories.some((scope: any) => scope.category === product.category);
      const inCollectionScope = offer.scopesCollections.some((scope: any) => scope.collection === product.collection);

      return inProductScope || inCategoryScope || inCollectionScope;
    });
  }

  private calculateOfferDiscount(offer: any, cartItems: CartItemDto[], productMap: Map<string, any>): OfferCalculationResult {
    const applicableItems = this.getApplicableCartItems(offer, cartItems, productMap);
    
    let discount = 0;
    const freeItems: { productId: string; quantity: number }[] = [];

    if (offer.type === OfferType.PERCENT_OFF) {
      const applicableAmount = applicableItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      discount = (applicableAmount * offer.percentOff) / 100;
    } else if (offer.type === OfferType.AMOUNT_OFF) {
      discount = offer.amountOff;
    } else if (offer.type === OfferType.FREE_ITEM) {
      // Calculate how many free items to give based on qualifying quantity
      if (offer.appliesToAnyQty) {
        const totalQualifyingQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const freeQty = Math.floor(totalQualifyingQty / offer.minQuantity) * (offer.freeItemQty || 1);
        if (freeQty > 0) {
          freeItems.push({
            productId: offer.freeItemProductId,
            quantity: freeQty,
          });
        }
      } else {
        // Apply to each applicable item individually
        for (const item of applicableItems) {
          const freeQty = Math.floor(item.quantity / offer.minQuantity) * (offer.freeItemQty || 1);
          if (freeQty > 0) {
            freeItems.push({
              productId: offer.freeItemProductId,
              quantity: freeQty,
            });
          }
        }
      }
    }

    return {
      offerId: offer.id,
      offerName: offer.name,
      type: offer.type,
      discount,
      freeItems: freeItems.length > 0 ? freeItems : undefined,
    };
  }
}