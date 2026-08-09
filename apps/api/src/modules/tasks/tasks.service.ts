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

  async create(workspaceId: string, projectId: string, creatorId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        workspaceId,
        projectId,
        creatorId,
        assigneeId: dto.assigneeId,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async update(taskId: string, dto: UpdateTaskDto) {
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
      },
    });
    this.eventsGateway.broadcastTaskUpdate(updatedTask.projectId, updatedTask);
    return updatedTask;
  }
}