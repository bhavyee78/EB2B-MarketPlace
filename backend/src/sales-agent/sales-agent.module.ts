import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SalesAgentController, SalesAgentGateway } from './sales-agent.controller';
import { SalesAgentService } from './sales-agent.service';
import { RealtimeVoiceService } from './realtime-voice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SalesAgentController],
  providers: [SalesAgentService, SalesAgentGateway, RealtimeVoiceService],
  exports: [SalesAgentService],
})
export class SalesAgentModule {}