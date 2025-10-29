import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Feature {
  feature: string;
  priority: number;
  count: number;
  isActive: boolean;
}

export interface FeatureBlock {
  feature: string;
  priority: number;
  products: any[];
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(private prisma: PrismaService) {}

  // GET /api/features - Public marketplace endpoint
  async getPublicFeatures(): Promise<{ features: Feature[] }> {
    try {
      // Get all distinct features from products with counts
      const productFeatures = await this.prisma.product.groupBy({
        by: ['feature'],
        where: {
          feature: {
            not: null,
            notIn: [''],
          },
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      });

      // Get feature priorities
      const featurePriorities = await this.prisma.featurePriority.findMany({
        where: {
          isActive: true,
        },
      });

      // Merge data
      const features: Feature[] = productFeatures
        .map((pf) => {
          const priority = featurePriorities.find(
            (fp) => fp.feature === pf.feature,
          );
          return {
            feature: pf.feature!,
            priority: priority?.priority || 999,
            count: pf._count.id,
            isActive: priority?.isActive !== false,
          };
        })
        .filter((f) => f.isActive)
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.feature.localeCompare(b.feature);
        });

      return { features };
    } catch (error) {
      this.logger.error('Error fetching public features:', error);
      throw error;
    }
  }

  // GET /api/home/feature-blocks - Helper endpoint for home page
  async getFeatureBlocks(perFeature = 12): Promise<{ blocks: FeatureBlock[] }> {
    try {
      const { features } = await this.getPublicFeatures();
      
      const blocks: FeatureBlock[] = [];

      for (const feature of features) {
        const products = await this.prisma.product.findMany({
          where: {
            feature: feature.feature,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            price: true,
            moq: true,
            images: true,
            filename: true,
            pcPrice: true,
            csPrice: true,
            pcQuantity: true,
            csQuantity: true,
            packSize: true,
            tags: true,
            category: true,
            collection: true,
          },
          take: perFeature,
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Transform products to include image_url
        const transformedProducts = products.map((product) => {
          const images = Array.isArray(product.images) ? product.images : [];
          const imageUrl = images.length > 0 
            ? (typeof images[0] === 'string' ? images[0] : images[0])
            : (product.filename ? `/uploads/products/${product.filename}` : null);

          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price.toString()),
            moq: product.moq,
            image_url: imageUrl,
            pcPrice: product.pcPrice ? parseFloat(product.pcPrice.toString()) : null,
            csPrice: product.csPrice ? parseFloat(product.csPrice.toString()) : null,
            pcQuantity: product.pcQuantity || null,
            csQuantity: product.csQuantity || null,
            packSize: product.packSize,
            tags: product.tags,
            category: product.category,
            collection: product.collection,
            images: [imageUrl].filter(Boolean),
          };
        });

        if (transformedProducts.length > 0) {
          blocks.push({
            feature: feature.feature,
            priority: feature.priority,
            products: transformedProducts,
          });
        }
      }

      return { blocks };
    } catch (error) {
      this.logger.error('Error fetching feature blocks:', error);
      throw error;
    }
  }

  // GET /api/admin/features - Admin endpoint
  async getAdminFeatures(): Promise<{ features: any[] }> {
    try {
      // Get all distinct features from products
      const productFeatures = await this.prisma.product.groupBy({
        by: ['feature'],
        where: {
          feature: {
            not: null,
            notIn: [''],
          },
        },
        _count: {
          id: true,
        },
      });

      // Get all feature priorities
      const featurePriorities = await this.prisma.featurePriority.findMany();

      // Create a map for quick lookup
      const priorityMap = new Map(
        featurePriorities.map((fp) => [fp.feature, fp])
      );

      // Merge data - include all features found in products
      const features = productFeatures.map((pf) => {
        const priority = priorityMap.get(pf.feature!);
        return {
          feature: pf.feature!,
          priority: priority?.priority || 999,
          isActive: priority?.isActive !== false,
          count: pf._count.id,
          id: priority?.id,
        };
      });

      // Sort by priority, then by feature name
      features.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.feature.localeCompare(b.feature);
      });

      return { features };
    } catch (error) {
      this.logger.error('Error fetching admin features:', error);
      throw error;
    }
  }

  // PUT /api/admin/features - Admin bulk upsert
  async updateFeaturePriorities(items: Array<{
    feature: string;
    priority: number;
    isActive: boolean;
  }>): Promise<{ success: boolean }> {
    try {
      // Use transaction to update all at once
      await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.featurePriority.upsert({
            where: { feature: item.feature },
            update: {
              priority: item.priority,
              isActive: item.isActive,
            },
            create: {
              feature: item.feature,
              priority: item.priority,
              isActive: item.isActive,
            },
          })
        )
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error updating feature priorities:', error);
      throw error;
    }
  }
}