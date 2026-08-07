import { Body, Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
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
  async findAll(@Param('projectId') projectId: string) {
    const tasks = await this.tasksService.findByProject(projectId);
    return { success: true, data: tasks };
  }

  @Patch(':taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(taskId, updateTaskDto);
    return { success: true, data: task };
  }
}