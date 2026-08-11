import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { DatabaseModule } from '../../database/database.module'; 
import { EventsGateway } from '../../gateways/events.gateway';

@Module({
  imports: [DatabaseModule],
  controllers: [CommentsController],
  providers: [CommentsService, EventsGateway],
})
export class CommentsModule {}