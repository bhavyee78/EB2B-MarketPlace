import { IsEmail, IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, Min, Max } from 'class-validator';
import { LeadStatus, ActivityType, TaskStatus } from '@prisma/client';

// Lead DTOs
export class CreateLeadDto {
  @IsString()
  companyName: string;

  @IsString()
  contactName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  address?: any;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  closeProbability?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  address?: any;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  closeProbability?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsDateString()
  lastContactDate?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

// Activity DTOs
export class CreateActivityDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

// Task DTOs
export class CreateTaskDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

// Query DTOs
export class LeadQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  offset?: number = 0;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ActivityQueryDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  offset?: number = 0;
}

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  offset?: number = 0;
}