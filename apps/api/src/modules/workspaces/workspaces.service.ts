import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: createWorkspaceDto.slug },
    });

    if (existing) {
      throw new ConflictException('Workspace URL slug is already taken');
    }
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: createWorkspaceDto.name,
          slug: createWorkspaceDto.slug,
          description: createWorkspaceDto.description,
        },
      });
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: userId,
          role: Role.OWNER,
        },
      });

      return workspace;
    });
  }
}