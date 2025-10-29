import { Controller, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('api/sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get('kpis')
  async getKpis(@Query('period') period?: string) {
    return this.salesService.getKpis(period);
  }
}