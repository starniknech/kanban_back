import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../common/auth/auth-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { ProjectRole } from '../common/enums/domain.enums';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateMemberRolesDto } from './dto/update-member-roles.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.projectsService.listForUser(user.id);
  }

  @Get(':projectId')
  findById(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projectsService.findById(user.id, projectId);
  }

  @Patch(':projectId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, projectId, body);
  }

  @Delete(':projectId')
  delete(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.projectsService.delete(user.id, projectId);
  }

  @Get(':projectId/members')
  listMembers(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.listMembers(user.id, projectId);
  }

  @Patch(':projectId/members/:memberId/roles')
  updateMemberRoles(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRolesDto,
  ) {
    return this.projectsService.updateMemberRoles(
      user.id,
      projectId,
      memberId,
      body.role,
    );
  }

  @Delete(':projectId/members/:memberId')
  removeMember(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectsService.removeMember(user.id, projectId, memberId);
  }
}
