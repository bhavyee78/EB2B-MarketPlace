import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateActivityDto,
  UpdateActivityDto,
  CreateTaskDto,
  UpdateTaskDto,
  LeadQueryDto,
  ActivityQueryDto,
  TaskQueryDto,
} from './dto/sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SALESMAN, UserRole.ADMIN)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Dashboard
  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.crmService.getDashboardStats(req.user.userId, req.user.role);
  }

  @Get('pipeline')
  async getPipeline(@Request() req) {
    return this.crmService.getLeadPipeline(req.user.userId, req.user.role);
  }

  // Leads
  @Get('leads')
  async getLeads(@Query() query: LeadQueryDto, @Request() req) {
    return this.crmService.findAllLeads(query, req.user.userId, req.user.role);
  }

  @Get('leads/:id')
  async getLeadById(@Param('id') id: string, @Request() req) {
    return this.crmService.findLeadById(id, req.user.userId, req.user.role);
  }

  @Post('leads')
  async createLead(@Body() dto: CreateLeadDto, @Request() req) {
    return this.crmService.createLead(dto, req.user.userId);
  }

  @Put('leads/:id')
  async updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Request() req,
  ) {
    return this.crmService.updateLead(id, dto, req.user.userId, req.user.role);
  }

  @Delete('leads/:id')
  async deleteLead(@Param('id') id: string, @Request() req) {
    return this.crmService.deleteLead(id, req.user.userId, req.user.role);
  }

  // Activities
  @Get('activities')
  async getActivities(@Query() query: ActivityQueryDto, @Request() req) {
    return this.crmService.findAllActivities(query, req.user.userId, req.user.role);
  }

  @Post('activities')
  async createActivity(@Body() dto: CreateActivityDto, @Request() req) {
    return this.crmService.createActivity(dto, req.user.userId);
  }

  @Put('activities/:id')
  async updateActivity(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @Request() req,
  ) {
    return this.crmService.updateActivity(id, dto, req.user.userId, req.user.role);
  }

  // Tasks
  @Get('tasks')
  async getTasks(@Query() query: TaskQueryDto, @Request() req) {
    return this.crmService.findAllTasks(query, req.user.userId, req.user.role);
  }

  @Post('tasks')
  async createTask(@Body() dto: CreateTaskDto, @Request() req) {
    return this.crmService.createTask(dto, req.user.userId);
  }

  @Put('tasks/:id')
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.crmService.updateTask(id, dto, req.user.userId, req.user.role);
  }
}