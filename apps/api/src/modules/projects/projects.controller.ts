import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../workspaces/roles.guard';
import { Roles } from '../workspaces/roles.decorator';

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard) // Double security!
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectsService.create(workspaceId, user.sub, createProjectDto);
    return { success: true, data: project };
  }

  @Get()
  async findAll(@Param('workspaceId') workspaceId: string) {
    const projects = await this.projectsService.findByWorkspace(workspaceId);
    return { success: true, data: projects };
  }
}