import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, authorId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
}