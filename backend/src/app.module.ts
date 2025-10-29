import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { RfqsModule } from './rfqs/rfqs.module';
import { SalesModule } from './sales/sales.module';
import { AdminModule } from './admin/admin.module';
import { BannersModule } from './banners/banners.module';
import { OffersModule } from './offers/offers.module';
import { SalesAgentModule } from './sales-agent/sales-agent.module';
import { CollectionImagesModule } from './collection-images/collection-images.module';
import { FeaturesModule } from './features/features.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    RfqsModule,
    SalesModule,
    AdminModule,
    BannersModule,
    OffersModule,
    SalesAgentModule,
    CollectionImagesModule,
    FeaturesModule,
  ],
})
export class AppModule {}