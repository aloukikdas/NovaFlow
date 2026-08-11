import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EventsGateway } from '../../gateways/events.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}
  async create(projectId: string, taskId: string, authorId: string, dto: CreateCommentDto) {
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
          const notif = await this.prisma.notification.create({
            data: {
              userId: mentionedUser.id,
              type: 'MENTION',
              content: `${comment.author.name} mentioned you: "${dto.content.substring(0, 20)}..."`
            }
          });
          this.eventsGateway.broadcastNotification(projectId, notif); 
        }
      }
    }
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (parentComment && parentComment.authorId !== authorId) {
        const replyNotif = await this.prisma.notification.create({
          data: {
            userId: parentComment.authorId,
            type: 'REPLY',
            content: `${comment.author.name} replied to your comment.`
          }
        });
        this.eventsGateway.broadcastNotification(projectId, replyNotif);
      }
    }
    this.eventsGateway.broadcastComment(projectId, comment);
    return comment;
  }

  async findByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}