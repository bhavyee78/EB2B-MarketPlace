import { IsOptional, IsEnum, IsBoolean, IsDateString, IsNumber, Min, IsString, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OfferType } from './create-offer.dto';

export class QueryOffersDto {
  @IsOptional()
  @IsEnum(OfferType)
  type?: OfferType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ApplicableOffersDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  collection?: string;

  @IsOptional()
  @IsArray()
  cartItems?: CartItemDto[];
}

export class CartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  unitPrice: number;
}