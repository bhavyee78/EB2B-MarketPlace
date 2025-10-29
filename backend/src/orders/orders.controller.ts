import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req, @Query() query) {
    return this.ordersService.findAll(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto, @Req() req) {
    return this.ordersService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto, @Req() req) {
    return this.ordersService.update(id, dto, req.user.id);
  }

  // Admin routes
  @Get('admin/all')
  async findAllForAdmin(@Query() query) {
    return this.ordersService.findAllForAdmin(query);
  }

  @Put('admin/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}