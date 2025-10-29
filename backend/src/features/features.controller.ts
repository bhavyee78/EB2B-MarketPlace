import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Query, 
  Logger,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { FeaturesService } from './features.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class FeaturesController {
  private readonly logger = new Logger(FeaturesController.name);

  constructor(private readonly featuresService: FeaturesService) {}

  // Public marketplace endpoints
  @Get('api/features')
  async getPublicFeatures() {
    try {
      return await this.featuresService.getPublicFeatures();
    } catch (error) {
      this.logger.error('Error in getPublicFeatures:', error);
      return { features: [] };
    }
  }

  @Get('api/home/feature-blocks')
  async getFeatureBlocks(
    @Query('perFeature', new ParseIntPipe({ optional: true })) perFeature?: number
  ) {
    try {
      return await this.featuresService.getFeatureBlocks(perFeature || 12);
    } catch (error) {
      this.logger.error('Error in getFeatureBlocks:', error);
      return { blocks: [] };
    }
  }

  // Admin endpoints
  @Get('api/admin/features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminFeatures() {
    try {
      return await this.featuresService.getAdminFeatures();
    } catch (error) {
      this.logger.error('Error in getAdminFeatures:', error);
      return { features: [] };
    }
  }

  @Put('api/admin/features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateFeaturePriorities(
    @Body() body: {
      items: Array<{
        feature: string;
        priority: number;
        isActive: boolean;
      }>;
    }
  ) {
    try {
      this.logger.log(`Updating feature priorities for ${body.items.length} items`);
      return await this.featuresService.updateFeaturePriorities(body.items);
    } catch (error) {
      this.logger.error('Error in updateFeaturePriorities:', error);
      return { success: false, error: 'Failed to update feature priorities' };
    }
  }
}