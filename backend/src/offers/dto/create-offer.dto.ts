import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum OfferType {
  FREE_ITEM = 'FREE_ITEM',
  PERCENT_OFF = 'PERCENT_OFF',
  AMOUNT_OFF = 'AMOUNT_OFF'
}

export class OfferScopesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  products?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];
}

export class CreateOfferDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(OfferType)
  type: OfferType;

  // Type-specific fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseFloat(value))
  percentOff?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  amountOff?: number;

  @IsOptional()
  @IsString()
  freeItemProductId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  freeItemQty?: number;

  // Eligibility fields
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minOrderAmount?: number;

  @IsOptional()
  @IsBoolean()
  appliesToAnyQty?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerUser?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTotalRedemptions?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => OfferScopesDto)
  scopes: OfferScopesDto;
}