import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateLeadDto, 
  UpdateLeadDto, 
  CreateActivityDto, 
  UpdateActivityDto,
  CreateTaskDto,
  UpdateTaskDto,
  LeadQueryDto,
  ActivityQueryDto,
  TaskQueryDto
} from './dto/sales.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // Lead Management
  async findAllLeads(query: LeadQueryDto, userId: string, userRole: UserRole) {
    const { search, status, assignedToId, source, limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    let where: any = {};

    // If not admin, only show leads assigned to the user
    if (userRole === UserRole.SALESMAN) {
      where.assignedToId = userId;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          assignedTo: {
            select: { id: true, fullName: true, email: true }
          },
          activities: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: { type: true, subject: true, createdAt: true }
          },
          tasks: {
            where: { status: { not: 'COMPLETED' } },
            take: 3,
            orderBy: { dueDate: 'asc' },
            select: { title: true, status: true, dueDate: true, priority: true }
          }
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      leads,
      total,
      limit,
      offset,
    };
  }

  async findLeadById(id: string, userId: string, userRole: UserRole) {
    const where: any = { id };
    
    // If not admin, only show leads assigned to the user
    if (userRole === UserRole.SALESMAN) {
      where.assignedToId = userId;
    }

    const lead = await this.prisma.lead.findFirst({
      where,
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: { id: true, fullName: true }
            }
          }
        }
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async createLead(dto: CreateLeadDto, userId: string) {
    return this.prisma.lead.create({
      data: {
        ...dto,
        assignedToId: dto.assignedToId || userId,
        address: dto.address || {},
        tags: dto.tags || [],
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
  }

  async updateLead(id: string, dto: UpdateLeadDto, userId: string, userRole: UserRole) {
    // Check if lead exists and user has permission
    const existingLead = await this.findLeadById(id, userId, userRole);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        lastContactDate: dto.lastContactDate ? new Date(dto.lastContactDate) : undefined,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
      },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });
  }

  async deleteLead(id: string, userId: string, userRole: UserRole) {
    // Check if lead exists and user has permission
    await this.findLeadById(id, userId, userRole);

    return this.prisma.lead.delete({
      where: { id },
    });
  }

  // Activity Management
  async findAllActivities(query: ActivityQueryDto, userId: string, userRole: UserRole) {
    const { leadId, type, limit = 20, offset = 0 } = query;

    let where: any = {};

    // If not admin, only show activities by the user
    if (userRole === UserRole.SALESMAN) {
      where.userId = userId;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (type) {
      where.type = type;
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true }
          },
          user: {
            select: { id: true, fullName: true }
          }
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      activities,
      total,
      limit,
      offset,
    };
  }

  async createActivity(dto: CreateActivityDto, userId: string) {
    return this.prisma.activity.create({
      data: {
        ...dto,
        userId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: {
        lead: {
          select: { id: true, companyName: true, contactName: true }
        }
      }
    });
  }

  async updateActivity(id: string, dto: UpdateActivityDto, userId: string, userRole: UserRole) {
    const where: any = { id };
    
    // If not admin, only allow updating own activities
    if (userRole === UserRole.SALESMAN) {
      where.userId = userId;
    }

    const activity = await this.prisma.activity.findFirst({ where });
    
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });
  }

  // Task Management
  async findAllTasks(query: TaskQueryDto, userId: string, userRole: UserRole) {
    const { assignedToId, status, leadId, limit = 20, offset = 0 } = query;

    let where: any = {};

    // If not admin, only show tasks assigned to the user
    if (userRole === UserRole.SALESMAN) {
      where.assignedToId = userId;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true }
          },
          assignedTo: {
            select: { id: true, fullName: true }
          }
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      limit,
      offset,
    };
  }

  async createTask(dto: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
      data: {
        ...dto,
        assignedToId: dto.assignedToId || userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        lead: {
          select: { id: true, companyName: true, contactName: true }
        }
      }
    });
  }

  async updateTask(id: string, dto: UpdateTaskDto, userId: string, userRole: UserRole) {
    const where: any = { id };
    
    // If not admin, only allow updating assigned tasks
    if (userRole === UserRole.SALESMAN) {
      where.assignedToId = userId;
    }

    const task = await this.prisma.task.findFirst({ where });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });
  }

  // Dashboard Analytics
  async getDashboardStats(userId: string, userRole: UserRole) {
    const isAdmin = userRole === UserRole.ADMIN;
    const baseWhere = isAdmin ? {} : { assignedToId: userId };

    const [
      totalLeads,
      activeLeads,
      recentActivities,
      upcomingTasks,
      leadsThisMonth,
      leadsLastMonth,
      salesTargets
    ] = await Promise.all([
      this.prisma.lead.count({
        where: baseWhere
      }),
      this.prisma.lead.count({
        where: {
          ...baseWhere,
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] }
        }
      }),
      this.prisma.activity.findMany({
        where: isAdmin ? {} : { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: { companyName: true, contactName: true }
          }
        }
      }),
      this.prisma.task.findMany({
        where: {
          ...(isAdmin ? {} : { assignedToId: userId }),
          status: { not: 'COMPLETED' },
          dueDate: { gte: new Date() }
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          lead: {
            select: { companyName: true, contactName: true }
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      this.prisma.lead.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      isAdmin ? null : this.prisma.salesTarget.findMany({
        where: { salesmanId: userId },
        orderBy: { period: 'desc' },
        take: 3
      })
    ]);

    // Calculate pipeline value
    const pipelineValue = await this.prisma.lead.aggregate({
      where: {
        ...baseWhere,
        status: { in: ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] },
        estimatedValue: { not: null }
      },
      _sum: {
        estimatedValue: true
      }
    });

    return {
      totalLeads,
      activeLeads,
      pipelineValue: pipelineValue._sum.estimatedValue || 0,
      leadsThisMonth,
      leadsLastMonth,
      recentActivities,
      upcomingTasks,
      salesTargets,
      conversionRate: totalLeads > 0 ? ((totalLeads - activeLeads) / totalLeads * 100).toFixed(1) : 0
    };
  }

  // Lead Status Pipeline
  async getLeadPipeline(userId: string, userRole: UserRole) {
    const baseWhere = userRole === UserRole.ADMIN ? {} : { assignedToId: userId };

    const pipeline = await this.prisma.lead.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        status: true
      },
      _sum: {
        estimatedValue: true
      }
    });

    return pipeline.map(item => ({
      status: item.status,
      count: item._count.status,
      value: item._sum.estimatedValue || 0
    }));
  }
}