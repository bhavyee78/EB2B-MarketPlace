import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { LocalUploadService } from './local-upload.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [LocalUploadService],
  exports: [LocalUploadService],
})
export class AdminModule {}