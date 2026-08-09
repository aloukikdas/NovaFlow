import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { DatabaseModule } from '../../database/database.module'; 
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [DatabaseModule, GatewaysModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}