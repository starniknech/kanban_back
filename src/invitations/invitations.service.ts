import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ADMIN_ROLES, MEMBER_ROLES } from '../common/auth/role-utils';
import { InvitationRole, InvitationStatus, NotificationStatus, ProjectRole } from '../common/enums/domain.enums';
import { toObjectId } from '../common/utils/object-id';
import { RealtimeInvitationsGateway } from '../realtime/invitations.gateway';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { UsersService } from '../users/users.service';
import { Invitation } from './invitations.model';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<Invitation>,
    private readonly userProjectsService: UserProjectsService,
    private readonly usersService: UsersService,
    private readonly realtimeInvitationsGateway: RealtimeInvitationsGateway,
  ) {}

  async create(userId: string, projectId: string, data: { email: string; role: InvitationRole }) {
    const membership = await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    if (data.role === InvitationRole.ADMIN && !membership.role.includes(ProjectRole.OWNER)) {
      throw new ForbiddenException('Only owner can invite admins');
    }

    const invitedUser = await this.usersService.findByEmail(data.email);
    const invitation = await this.invitationModel.create({
      projectId: toObjectId(projectId),
      invitedByUserId: toObjectId(userId),
      invitedUserId: invitedUser?._id ?? null,
      email: data.email.toLowerCase(),
      role: data.role,
      status: InvitationStatus.PENDING,
      notificationStatus: NotificationStatus.UNREAD,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    this.realtimeInvitationsGateway.emitCreated(projectId, invitation);

    return invitation;
  }

  async listProjectInvitations(userId: string, projectId: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);
    return this.invitationModel.find({ projectId: toObjectId(projectId) }).exec();
  }

  async listMyInvitations(userId: string, email: string) {
    return this.invitationModel
      .find({
        $or: [{ invitedUserId: toObjectId(userId) }, { email: email.toLowerCase() }],
        status: InvitationStatus.PENDING,
      })
      .exec();
  }

  async updateNotificationStatus(
    userId: string,
    invitationId: string,
    notificationStatus: NotificationStatus,
  ) {
    const invitation = await this.invitationModel.findById(toObjectId(invitationId)).exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.usersService.findById(userId);
    const isInvitedUser = invitation.invitedUserId?.toString() === userId;
    const isInvitedEmail = user ? invitation.email === user.email.toLowerCase() : false;

    if (!isInvitedUser && !isInvitedEmail) {
      throw new ForbiddenException('This invitation belongs to another user');
    }

    invitation.notificationStatus = notificationStatus;
    return invitation.save();
  }

  async accept(userId: string, invitationId: string) {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (!user || invitation.email !== user.email) {
      throw new ForbiddenException('This invitation belongs to another user');
    }

    const role = invitation.role === InvitationRole.ADMIN ? ADMIN_ROLES : MEMBER_ROLES;

    await this.userProjectsService.createMembership(userId, invitation.projectId.toString(), role);

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await invitation.save();

    this.realtimeInvitationsGateway.emitAccepted(invitation.projectId.toString(), invitation);

    return invitation;
  }

  async decline(userId: string, invitationId: string) {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (!user || invitation.email !== user.email) {
      throw new ForbiddenException('This invitation belongs to another user');
    }

    invitation.status = InvitationStatus.DECLINED;
    invitation.declinedAt = new Date();
    const updated = await invitation.save();

    this.realtimeInvitationsGateway.emitDeclined(invitation.projectId.toString(), updated);

    return updated;
  }

  async cancel(userId: string, projectId: string, invitationId: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    const invitation = await this.invitationModel
      .findOne({
        _id: toObjectId(invitationId),
        projectId: toObjectId(projectId),
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.CANCELLED;
    invitation.cancelledAt = new Date();
    const updated = await invitation.save();

    this.realtimeInvitationsGateway.emitCancelled(projectId, updated);

    return updated;
  }

  private async getPendingInvitation(invitationId: string): Promise<Invitation> {
    const invitation = await this.invitationModel.findById(toObjectId(invitationId)).exec();

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new NotFoundException('Pending invitation not found');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitation.save();
      throw new NotFoundException('Invitation expired');
    }

    return invitation;
  }
}
