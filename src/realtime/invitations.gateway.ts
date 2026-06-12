import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { FrontendRealtimeEvent, RealtimeEvent } from '../common/enums/domain.enums';
import { Invitation } from '../invitations/invitations.model';
import { InvitationsService } from '../invitations/invitations.service';
import {
  getDashboardEmailRoom,
  getDashboardUserRoom,
  getProjectRoom,
  getUserRoom,
  REALTIME_GATEWAY_OPTIONS,
} from './realtime.constants';
import {
  CancelInvitationPayload,
  CreateInvitationPayload,
  DashboardInvitationsPayload,
  ErrorPayload,
  InvitationActionPayload,
  RealtimeRoomEmitter,
  RealtimeServer,
  RealtimeSocket,
  requireSocketUser,
  ServerEventPayload,
  UpdateInvitationPayload,
  UpdateInvitationNotificationStatusPayload,
} from './realtime.types';

@Injectable()
@WebSocketGateway(REALTIME_GATEWAY_OPTIONS)
export class RealtimeInvitationsGateway {
  @WebSocketServer()
  server: RealtimeServer;

  constructor(
    @Inject(forwardRef(() => InvitationsService))
    private readonly invitationsService: InvitationsService,
  ) {}

  @SubscribeMessage(FrontendRealtimeEvent.DASHBOARD_JOIN)
  async joinDashboard(@ConnectedSocket() client: RealtimeSocket): Promise<DashboardInvitationsPayload> {
    const user = requireSocketUser(client);

    await client.join([getDashboardUserRoom(user.id), getDashboardEmailRoom(user.email)]);

    const invitations = await this.invitationsService.listMyInvitations(user.id, user.email);
    const payload = { invitations };

    client.emit(RealtimeEvent.DASHBOARD_INVITATIONS, payload);

    return payload;
  }

  @SubscribeMessage(FrontendRealtimeEvent.DASHBOARD_LEAVE)
  async leaveDashboard(@ConnectedSocket() client: RealtimeSocket): Promise<{ ok: true }> {
    const user = requireSocketUser(client);

    await client.leave(getDashboardUserRoom(user.id));
    await client.leave(getDashboardEmailRoom(user.email));

    return { ok: true };
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_CREATE)
  createInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: CreateInvitationPayload,
  ): Promise<Invitation> {
    const user = requireSocketUser(client);
    const { projectId, ...data } = body;
    return this.invitationsService.create(user.id, projectId, data);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_UPDATE)
  updateInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: UpdateInvitationPayload,
  ): Promise<Invitation> {
    const user = requireSocketUser(client);
    const { projectId, invitationId, ...data } = body;

    return this.invitationsService.update(user.id, projectId, invitationId, data);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_UPDATE_NOTIFICATION_STATUS)
  updateInvitationNotificationStatus(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: UpdateInvitationNotificationStatusPayload,
  ): Promise<Invitation> {
    const user = requireSocketUser(client);

    return this.invitationsService.updateNotificationStatus(user.id, body.invitationId, body.notificationStatus);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_ACCEPT)
  acceptInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: InvitationActionPayload,
  ): Promise<Invitation> {
    const user = requireSocketUser(client);

    return this.invitationsService.accept(user.id, body.invitationId);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_DECLINE)
  declineInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: InvitationActionPayload,
  ): Promise<Invitation> {
    const user = requireSocketUser(client);

    return this.invitationsService.decline(user.id, body.invitationId);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_CANCEL)
  cancelInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: CancelInvitationPayload,
  ): Promise<Invitation> {
    return this.cancelProjectInvitation(client, body);
  }

  @SubscribeMessage(FrontendRealtimeEvent.INVITATION_DELETE)
  deleteInvitation(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: CancelInvitationPayload,
  ): Promise<Invitation> {
    return this.cancelProjectInvitation(client, body);
  }

  emitCreated(projectId: string, invitation: Invitation) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_CREATED, invitation);
    this.emitToInvitationDashboard(invitation, RealtimeEvent.INVITATION_CREATED, invitation);
  }

  emitUpdated(projectId: string, invitation: Invitation) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_UPDATED, invitation);
    this.emitToInvitationDashboard(invitation, RealtimeEvent.INVITATION_UPDATED, invitation);
  }

  emitAccepted(projectId: string, invitation: Invitation) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_ACCEPTED, invitation);
    this.emitToInvitationDashboard(invitation, RealtimeEvent.INVITATION_ACCEPTED, invitation);
  }

  emitDeclined(projectId: string, invitation: Invitation) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_DECLINED, invitation);
    this.emitToInvitationDashboard(invitation, RealtimeEvent.INVITATION_DECLINED, invitation);
  }

  emitCancelled(projectId: string, invitation: Invitation) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_CANCELLED, invitation);
    this.emitToInvitationDashboard(invitation, RealtimeEvent.INVITATION_CANCELLED, invitation);
  }

  emitError(userId: string, payload: ErrorPayload) {
    const room = this.server?.to(getUserRoom(userId)) as RealtimeRoomEmitter | undefined;
    room?.emit(RealtimeEvent.ERROR, payload);
  }

  private cancelProjectInvitation(client: RealtimeSocket, body: CancelInvitationPayload): Promise<Invitation> {
    const user = requireSocketUser(client);

    return this.invitationsService.cancel(user.id, body.projectId, body.invitationId);
  }

  private emitToProject<TEvent extends RealtimeEvent>(
    projectId: string,
    event: TEvent,
    payload: ServerEventPayload<TEvent>,
  ) {
    const room = this.server?.to(getProjectRoom(projectId)) as RealtimeRoomEmitter | undefined;
    room?.emit(event, payload);
  }

  private emitToInvitationDashboard<TEvent extends RealtimeEvent>(
    invitation: Invitation,
    event: TEvent,
    payload: ServerEventPayload<TEvent>,
  ) {
    const rooms = this.getInvitationDashboardRooms(invitation);

    if (!rooms.length) {
      return;
    }

    const room = this.server?.to(rooms) as RealtimeRoomEmitter | undefined;
    room?.emit(event, payload);
  }

  private getInvitationDashboardRooms(invitation: Invitation): string[] {
    return [
      invitation.invitedUserId ? getDashboardUserRoom(invitation.invitedUserId.toString()) : null,
      getDashboardEmailRoom(invitation.email),
    ].filter((room): room is string => Boolean(room));
  }
}
