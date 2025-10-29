import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalUploadService } from '../admin/local-upload.service';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController],
  providers: [BannersService, LocalUploadService],
  exports: [BannersService]
})
export class BannersModule {}