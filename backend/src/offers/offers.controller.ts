import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { QueryOffersDto, ApplicableOffersDto } from './dto/query-offers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/offers')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  // @Roles('ADMIN')
  create(@Body() createOfferDto: CreateOfferDto) {
    // Use actual admin user ID for testing
    const adminUserId = 'c310ae38-844a-48b2-971d-2b8d5783cb62';
    return this.offersService.create(createOfferDto, adminUserId);
  }

  @Get()
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  // @Roles('ADMIN')
  findAll(@Query() queryDto: QueryOffersDto) {
    return this.offersService.findAll(queryDto);
  }

  @Get('applicable')
  findApplicable(@Query() queryDto: ApplicableOffersDto) {
    return this.offersService.findApplicableOffers(queryDto);
  }

  @Post('calculate')
  calculateCart(@Body() body: { cartItems: any[] }) {
    return this.offersService.calculateCartOffers(body.cartItems);
  }

  @Get(':id')
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  // @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  // @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
    return this.offersService.update(id, updateOfferDto);
  }

  @Delete(':id')
  // @UseGuards(RolesGuard) // Temporarily disabled for testing
  // @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }
}