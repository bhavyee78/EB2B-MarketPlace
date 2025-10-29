import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LocalUploadService } from './local-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/admin')
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
// @Roles('ADMIN')
export class AdminController {
  constructor(private uploadService: LocalUploadService) {}

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: await this.uploadService.uploadImage(file) };
  }

  @Post('import/outlets')
  @UseInterceptors(FileInterceptor('file'))
  async importOutlets(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.importOutlets(file);
  }

  @Post('import/products')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.importProducts(file);
  }

  @Post('upload/product-images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImages(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadProductImages(file);
  }
}