import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: 'http://localhost:3000', credentials: true } })
export class EventsGateway {
  @WebSocketServer()
  server!: Server;
  @SubscribeMessage('project:join')
  handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.join(`project:${projectId}`);
    console.log(`Client joined room: project:${projectId}`);
  }
  broadcastTaskUpdate(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('task:updated', task);
  }

  broadcastComment(projectId: string, comment: any) {
    this.server.to(projectId).emit('comment:new', comment);
  }

  broadcastNotification(projectId: string, notification: any) {
    this.server.to(projectId).emit('notification:new', notification);
  }
}