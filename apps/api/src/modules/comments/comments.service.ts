import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, authorId: string, dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId,
        authorId,
        parentId: dto.parentId,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    const mentionRegex = /@(\w+)/g;
    const matches = [...dto.content.matchAll(mentionRegex)];
    
    if (matches.length > 0) {
      const users = await this.prisma.user.findMany();
      
      for (const match of matches) {
        const mentionedName = match[1].toLowerCase();
        const mentionedUser = users.find(u => u.name.toLowerCase().includes(mentionedName));
        if (mentionedUser && mentionedUser.id !== authorId) {
          await this.prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              type: 'MENTION',
              content: `${comment.author.name} mentioned you in a comment: "${dto.content.substring(0, 20)}..."`
            }
          });
        }
      }
    }

    return comment;
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