import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CollectionImagesService } from './collection-images.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/collection-images')
export class CollectionImagesController {
  constructor(private collectionImagesService: CollectionImagesService) {}

  @Get()
  async findAll() {
    return this.collectionImagesService.findAll();
  }

  @Get(':collection')
  async findByCollection(@Param('collection') collection: string) {
    return this.collectionImagesService.findByCollection(collection);
  }

  @Post('upload/:collection')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/collections',
      filename: (req, file, callback) => {
        const collection = req.params.collection;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        callback(null, `collection_${collection}_${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async uploadCollectionImage(
    @Param('collection') collection: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { altText?: string }
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const imageUrl = `${process.env.API_URL || 'http://localhost:3000'}/uploads/collections/${file.filename}`;
    
    return this.collectionImagesService.upsertCollectionImage({
      collection,
      imageUrl,
      altText: body.altText,
    });
  }

  @Put(':collection')
  @UseGuards(JwtAuthGuard)
  async updateCollectionImage(
    @Param('collection') collection: string,
    @Body() updateData: { imageUrl?: string; altText?: string; isActive?: boolean }
  ) {
    return this.collectionImagesService.updateCollectionImage(collection, updateData);
  }

  @Delete(':collection')
  @UseGuards(JwtAuthGuard)
  async deleteCollectionImage(@Param('collection') collection: string) {
    return this.collectionImagesService.deleteCollectionImage(collection);
  }
}