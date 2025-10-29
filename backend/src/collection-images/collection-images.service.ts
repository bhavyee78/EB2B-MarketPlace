import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionImagesService {
  private readonly logger = new Logger(CollectionImagesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const collectionImages = await this.prisma.collectionImage.findMany({
        where: { isActive: true },
        orderBy: { collection: 'asc' },
      });

      return {
        success: true,
        data: collectionImages,
      };
    } catch (error) {
      this.logger.error('Error fetching collection images:', error);
      return {
        success: false,
        error: 'Failed to fetch collection images',
      };
    }
  }

  async findByCollection(collection: string) {
    try {
      const collectionImage = await this.prisma.collectionImage.findUnique({
        where: { collection },
      });

      return {
        success: true,
        data: collectionImage,
      };
    } catch (error) {
      this.logger.error(`Error fetching collection image for ${collection}:`, error);
      return {
        success: false,
        error: 'Failed to fetch collection image',
      };
    }
  }

  async upsertCollectionImage(data: {
    collection: string;
    imageUrl: string;
    altText?: string;
  }) {
    try {
      const collectionImage = await this.prisma.collectionImage.upsert({
        where: { collection: data.collection },
        update: {
          imageUrl: data.imageUrl,
          altText: data.altText,
          isActive: true,
        },
        create: {
          collection: data.collection,
          imageUrl: data.imageUrl,
          altText: data.altText,
          isActive: true,
        },
      });

      this.logger.log(`Collection image updated for: ${data.collection}`);

      return {
        success: true,
        data: collectionImage,
        message: 'Collection image uploaded successfully',
      };
    } catch (error) {
      this.logger.error('Error upserting collection image:', error);
      return {
        success: false,
        error: 'Failed to upload collection image',
      };
    }
  }

  async updateCollectionImage(
    collection: string,
    updateData: { imageUrl?: string; altText?: string; isActive?: boolean }
  ) {
    try {
      const existingImage = await this.prisma.collectionImage.findUnique({
        where: { collection },
      });

      if (!existingImage) {
        throw new NotFoundException(`Collection image for ${collection} not found`);
      }

      const updatedImage = await this.prisma.collectionImage.update({
        where: { collection },
        data: updateData,
      });

      return {
        success: true,
        data: updatedImage,
        message: 'Collection image updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating collection image:', error);
      return {
        success: false,
        error: error instanceof NotFoundException ? error.message : 'Failed to update collection image',
      };
    }
  }

  async deleteCollectionImage(collection: string) {
    try {
      await this.prisma.collectionImage.delete({
        where: { collection },
      });

      return {
        success: true,
        message: 'Collection image deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting collection image:', error);
      return {
        success: false,
        error: 'Failed to delete collection image',
      };
    }
  }

  // Helper method to get collections with their images for the marketplace
  async getCollectionsWithImages(collections: string[]) {
    try {
      const collectionImages = await this.prisma.collectionImage.findMany({
        where: {
          collection: { in: collections },
          isActive: true,
        },
      });

      // Create a map of collection names to image URLs
      const imageMap = collectionImages.reduce((acc, img) => {
        acc[img.collection] = img.imageUrl;
        return acc;
      }, {} as Record<string, string>);

      return {
        success: true,
        data: imageMap,
      };
    } catch (error) {
      this.logger.error('Error fetching collections with images:', error);
      return {
        success: false,
        error: 'Failed to fetch collections with images',
      };
    }
  }
}