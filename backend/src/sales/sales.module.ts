import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

@Module({
  controllers: [SalesController, CrmController],
  providers: [SalesService, CrmService],
  exports: [SalesService, CrmService],
})
export class SalesModule {}