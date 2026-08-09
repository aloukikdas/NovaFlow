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

  async getUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true }, 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkspaceById(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: { 
              select: { id: true, name: true, email: true } 
            },
          },
        },
      },
    });
  }

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async inviteUser(workspaceId: string, email: string, role: any) {
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email } },
    });
    if (existingMember) throw new Error('User is already a member');
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.workspaceInvitation.upsert({
      where: {
        workspaceId_email: { workspaceId, email },
      },
      update: { token, expiresAt, role },
      create: { workspaceId, email, role, token, expiresAt },
    });
  }
}