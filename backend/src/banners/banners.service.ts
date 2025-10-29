import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateBannerDto {
  title?: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
}

export interface UpdateBannerDto {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const banners = await this.prisma.banner.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    // Fix image URLs to use correct port
    return banners.map(banner => ({
      ...banner,
      imageUrl: banner.imageUrl?.replace('http://localhost:3001', 'http://localhost:3000') || banner.imageUrl
    }));
  }

  async findActive() {
    console.log('findActive banners called');
    const activeBanners = await this.prisma.banner.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    console.log('Found active banners:', activeBanners.length);
    console.log('Active banners data:', activeBanners);
    
    // Fix image URLs to use correct port
    const fixedBanners = activeBanners.map(banner => ({
      ...banner,
      imageUrl: banner.imageUrl?.replace('http://localhost:3001', 'http://localhost:3000') || banner.imageUrl
    }));
    
    return fixedBanners;
  }

  async findOne(id: string) {
    return this.prisma.banner.findUnique({
      where: { id }
    });
  }

  async create(data: CreateBannerDto) {
    return this.prisma.banner.create({
      data
    });
  }

  async update(id: string, data: UpdateBannerDto) {
    return this.prisma.banner.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.banner.delete({
      where: { id }
    });
  }

  async updateSortOrder(banners: { id: string; sortOrder: number }[]) {
    const updatePromises = banners.map(banner =>
      this.prisma.banner.update({
        where: { id: banner.id },
        data: { sortOrder: banner.sortOrder }
      })
    );

    return Promise.all(updatePromises);
  }
}