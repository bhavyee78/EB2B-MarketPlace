import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RfqsService } from './rfqs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/rfqs')
@UseGuards(JwtAuthGuard)
export class RfqsController {
  constructor(private rfqsService: RfqsService) {}

  @Get()
  async findAll(@Req() req) {
    if (req.user.role === 'ADMIN') {
      return this.rfqsService.findAllForAdmin();
    }
    return this.rfqsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.rfqsService.findOne(id, req.user);
  }

  @Post()
  async create(@Body() dto, @Req() req) {
    return this.rfqsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto) {
    return this.rfqsService.update(id, dto);
  }
}