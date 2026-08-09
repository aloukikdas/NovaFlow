import { Body, Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

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

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceMemberGuard)
  async getMembers(@Param('workspaceId') workspaceId: string) {
    const members = await this.workspacesService.getMembers(workspaceId);
    return { success: true, data: members };
  }

  @Post(':workspaceId/invitations')
  @UseGuards(WorkspaceMemberGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async inviteUser(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { email: string; role: string }
  ) {
    const invitation = await this.workspacesService.inviteUser(workspaceId, body.email, body.role);
    return { success: true, data: invitation };
  }
}