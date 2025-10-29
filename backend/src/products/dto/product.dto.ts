import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min } from 'class-validator';
import { ProductStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  feature?: string;

  @IsNumber()
  @Min(1)
  moq: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pcPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  csPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pcQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  csQuantity?: number;

  @IsOptional()
  @IsString()
  packSize?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number;

  @IsOptional()
  @IsArray()
  countriesBoughtIn?: string[];

  @IsOptional()
  @IsArray()
  customizationOptions?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  moq?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pcPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  csPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pcQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  csQuantity?: number;

  @IsOptional()
  @IsString()
  packSize?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number;

  @IsOptional()
  @IsArray()
  countriesBoughtIn?: string[];

  @IsOptional()
  @IsArray()
  customizationOptions?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  aiSuggestion?: string;

  @IsOptional()
  @IsString()
  feature?: string;
}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  feature?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}