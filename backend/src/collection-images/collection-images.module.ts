import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CollectionImagesController } from './collection-images.controller';
import { CollectionImagesService } from './collection-images.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads/collections',
    }),
  ],
  controllers: [CollectionImagesController],
  providers: [CollectionImagesService],
  exports: [CollectionImagesService],
})
export class CollectionImagesModule {}