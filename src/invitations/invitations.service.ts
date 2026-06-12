import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ADMIN_ROLES, MEMBER_ROLES } from '../common/auth/role-utils';
import {
  ErrorEnum,
  ErrorMessageEnum,
  InvitationRole,
  InvitationStatus,
  NotificationStatus,
  ProjectRole,
} from '../common/enums/domain.enums';
import { toObjectId } from '../common/utils/object-id';
import { RealtimeInvitationsGateway } from '../realtime/invitations.gateway';
import type { ErrorPayload } from '../realtime/realtime.types';
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
    @Inject(forwardRef(() => RealtimeInvitationsGateway))
    private readonly realtimeInvitationsGateway: RealtimeInvitationsGateway,
  ) {}

  async create(userId: string, projectId: string, data: { email: string; role: InvitationRole }) {
    const membership = await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    if (data.role === InvitationRole.ADMIN && !membership.role.includes(ProjectRole.OWNER)) {
      throw new ForbiddenException('Only owner can invite admins');
    }

    const invitedUser = await this.usersService.findByEmail(data.email);
    const email = data.email.toLowerCase();

    await this.ensureUserIsNotProjectMember(userId, projectId, invitedUser?.id);
    await this.ensureNoPendingInvitation(userId, projectId, email, invitedUser?.id);

    const invitation = await this.invitationModel.create({
      projectId: toObjectId(projectId),
      invitedByUserId: toObjectId(userId),
      invitedUserId: invitedUser?._id ?? null,
      email,
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

  async update(
    userId: string,
    projectId: string,
    invitationId: string,
    data: { email?: string; role?: InvitationRole },
  ) {
    const membership = await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    if (data.role === InvitationRole.ADMIN && !membership.role.includes(ProjectRole.OWNER)) {
      throw new ForbiddenException('Only owner can invite admins');
    }

    const invitation = await this.invitationModel
      .findOne({
        _id: toObjectId(invitationId),
        projectId: toObjectId(projectId),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Pending invitation not found');
    }

    if (data.email !== undefined) {
      const invitedUser = await this.usersService.findByEmail(data.email);
      const email = data.email.toLowerCase();

      await this.ensureUserIsNotProjectMember(userId, projectId, invitedUser?.id);
      await this.ensureNoPendingInvitation(userId, projectId, email, invitedUser?.id, invitationId);

      invitation.email = email;
      invitation.invitedUserId = invitedUser ? toObjectId(invitedUser.id) : null;
    }

    if (data.role !== undefined) {
      invitation.role = data.role;
    }

    const updated = await invitation.save();
    this.realtimeInvitationsGateway.emitUpdated(projectId, updated);

    return updated;
  }

  async listMyInvitations(userId: string, email: string) {
    return this.invitationModel
      .find({
        $or: [{ invitedUserId: toObjectId(userId) }, { email: email.toLowerCase() }],
        status: InvitationStatus.PENDING,
      })
      .exec();
  }

  async updateNotificationStatus(userId: string, invitationId: string, notificationStatus: NotificationStatus) {
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
    const updated = await invitation.save();

    this.realtimeInvitationsGateway.emitUpdated(invitation.projectId.toString(), updated);

    return updated;
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

  private async ensureNoPendingInvitation(
    userId: string,
    projectId: string,
    email: string,
    invitedUserId?: string | Types.ObjectId,
    excludeInvitationId?: string,
  ): Promise<void> {
    const recipientConditions: Record<string, unknown>[] = [{ email }];

    if (invitedUserId) {
      recipientConditions.push({ invitedUserId: toObjectId(invitedUserId) });
    }

    const existingInvitation = await this.invitationModel
      .findOne({
        projectId: toObjectId(projectId),
        status: InvitationStatus.PENDING,
        $or: recipientConditions,
        ...(excludeInvitationId ? { _id: { $ne: toObjectId(excludeInvitationId) } } : {}),
      })
      .exec();

    if (existingInvitation) {
      this.throwConflictError(userId, {
        statusCode: 409,
        message: ErrorMessageEnum.PENDING_INVITATION_ALREADY_EXISTS,
        error: ErrorEnum.PENDING_INVITATION_ALREADY_EXISTS,
      });
    }
  }

  private async ensureUserIsNotProjectMember(
    userId: string,
    projectId: string,
    invitedUserId?: string | Types.ObjectId,
  ): Promise<void> {
    if (!invitedUserId) {
      return;
    }

    const membership = await this.userProjectsService.findMembership(invitedUserId.toString(), projectId);

    if (membership) {
      this.throwConflictError(userId, {
        statusCode: 409,
        message: ErrorMessageEnum.USER_ALREADY_PROJECT_MEMBER,
        error: ErrorEnum.USER_ALREADY_PROJECT_MEMBER,
      });
    }
  }

  private throwConflictError(userId: string, payload: ErrorPayload) {
    this.realtimeInvitationsGateway.emitError(userId, payload);
  }
}
