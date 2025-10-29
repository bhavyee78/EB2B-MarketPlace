import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService, CreateBannerDto, UpdateBannerDto } from './banners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LocalUploadService } from '../admin/local-upload.service';

@Controller('api/banners')
export class BannersController {
  constructor(
    private bannersService: BannersService,
    private uploadService: LocalUploadService
  ) {}

  @Get()
  async findAll() {
    return this.bannersService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.bannersService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  async create(@Body() createBannerDto: CreateBannerDto) {
    return this.bannersService.create(createBannerDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File) {
    console.log('Banner upload endpoint hit');
    console.log('File received:', file ? 'Yes' : 'No');
    
    if (!file) {
      throw new Error('No file received');
    }
    
    const imageUrl = await this.uploadService.uploadBannerImage(file);
    return { imageUrl };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto) {
    return this.bannersService.update(id, updateBannerDto);
  }

  @Put('sort-order/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateSortOrder(@Body() banners: { id: string; sortOrder: number }[]) {
    return this.bannersService.updateSortOrder(banners);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.bannersService.delete(id);
  }
}