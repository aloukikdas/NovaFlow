import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { EventsGateway } from '../../gateways/events.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async logActivity(workspaceId: string, projectId: string, taskId: string, actorId: string, action: string) {
    await this.prisma.activityEvent.create({
      data: { workspaceId, projectId, taskId, actorId, action }
    });
  }

  async create(workspaceId: string, projectId: string, actorId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        workspaceId,
        projectId,
        creatorId: actorId,
        assigneeId: dto.assigneeId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      }
    });
    await this.logActivity(workspaceId, projectId, task.id, actorId, 'CREATED_TASK');
    
    return task;
  }

  async findByProject(
    projectId: string, 
    filters?: { assigneeId?: string; status?: string }, 
    pagination?: { page?: string; limit?: string }
  ) {
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 50;
    const skip = (page - 1) * limit;
    
    const where: any = { projectId };
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.status) where.status = filters.status;
    
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.task.count({ where })
    ]);
    
    return { data, meta: { total, page, limit } };
  }

  async update(taskId: string, actorId: string, dto: UpdateTaskDto) {
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { workspaceId: true } }
      },
    });

    await this.logActivity(updatedTask.project.workspaceId, updatedTask.projectId, updatedTask.id, actorId, 'UPDATED_TASK');
    if (dto.assigneeId && dto.assigneeId !== actorId) {
      await this.prisma.notification.create({
        data: {
          userId: dto.assigneeId,
          type: 'TASK_ASSIGNED',
          content: `You were assigned to a new task: ${updatedTask.title}`
        }
      });
    }
    this.eventsGateway.broadcastTaskUpdate(updatedTask.projectId, updatedTask);
    
    return updatedTask;
  }
}