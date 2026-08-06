import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.create(user.sub, createWorkspaceDto);
    
    return {
      success: true,
      data: workspace,
    };
  }

  @Get()
  async getUserWorkspaces(@CurrentUser() user: any) {
    const workspaces = await this.workspacesService.getUserWorkspaces(user.sub);
    return { success: true, data: workspaces };
  }

  @UseGuards(WorkspaceMemberGuard)
  @Get(':workspaceId')
  async getWorkspaceById(@Param('workspaceId') workspaceId: string) {
    const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
    return { success: true, data: workspace };
  }
}