import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../common/auth/auth-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('projects/:projectId/invitations')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, projectId, body);
  }

  @Get('projects/:projectId/invitations')
  listProjectInvitations(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    return this.invitationsService.listProjectInvitations(user.id, projectId);
  }

  @Get('invitations/my')
  listMyInvitations(@CurrentUser() user: AuthUser) {
    return this.invitationsService.listMyInvitations(user.id, user.email);
  }

  @Patch('invitations/:invitationId/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.accept(user.id, invitationId);
  }

  @Patch('invitations/:invitationId/decline')
  decline(
    @CurrentUser() user: AuthUser,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.decline(user.id, invitationId);
  }

  @Patch('projects/:projectId/invitations/:invitationId/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.cancel(user.id, projectId, invitationId);
  }
}
