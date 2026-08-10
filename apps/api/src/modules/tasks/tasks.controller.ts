import { Body, Controller, Get, Patch, Param, Post, UseGuards, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    const task = await this.tasksService.create(
      workspaceId,
      projectId,
      user.sub,
      createTaskDto,
    );
    return { success: true, data: task };
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.tasksService.findByProject(
      projectId, 
      { assigneeId, status }, 
      { page, limit }
    );
    return { success: true, ...result };
  }

  @Patch(':taskId')
  async update(
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(taskId, user.sub, updateTaskDto);
    return { success: true, data: task };
  }
}