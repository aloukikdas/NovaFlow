import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
        ownerId,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getActivityTimeline(projectId: string) {
    return this.prisma.activityEvent.findMany({
      where: { projectId },
      include: {
        actor: { select: { name: true, email: true } },
        task: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to the 50 most recent events
    });
  }
}