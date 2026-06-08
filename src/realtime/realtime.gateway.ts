import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { FrontendRealtimeEvent, RealtimeEvent } from '../common/enums/domain.enums';
import { Project } from '../projects/projects.model';
import { ProjectsService } from '../projects/projects.service';
import { UserProject } from '../user-projects/user-projects.model';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { getProjectRoom, REALTIME_GATEWAY_OPTIONS } from './realtime.constants';
import {
  getSocketUser,
  OnlineUser,
  ParticipantRemovedPayload,
  ProjectIdPayload,
  ProjectOnlineUsersPayload,
  ProjectPresenceAck,
  RealtimeRoomEmitter,
  RealtimeServer,
  RealtimeSocket,
  RemoveParticipantPayload,
  RenameProjectPayload,
  requireSocketUser,
  ServerEventPayload,
  UpdateParticipantRolesPayload,
} from './realtime.types';

type PopulatedUser = {
  _id: Types.ObjectId | string;
  name?: string;
  email?: string;
  avatar?: string;
};

type UserProjectWithMaybePopulatedUser = Omit<UserProject, 'userId'> & {
  userId: Types.ObjectId | PopulatedUser;
};

@Injectable()
@WebSocketGateway(REALTIME_GATEWAY_OPTIONS)
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: RealtimeServer;

  private readonly socketProjects = new Map<string, Set<string>>();
  private readonly projectUserSockets = new Map<string, Map<string, Set<string>>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userProjectsService: UserProjectsService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async handleConnection(client: RealtimeSocket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      });
      client.data.user = { id: payload.sub, email: payload.email };
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: RealtimeSocket) {
    const user = getSocketUser(client);
    const projectIds = this.socketProjects.get(client.id);

    if (!user || !projectIds?.size) {
      this.socketProjects.delete(client.id);
      return;
    }

    this.socketProjects.delete(client.id);

    for (const projectId of projectIds) {
      this.removePresence(projectId, user.id, client.id);
      await this.emitOnlineUsers(projectId);
    }
  }

  @SubscribeMessage(FrontendRealtimeEvent.PROJECT_JOIN)
  async joinProject(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: ProjectIdPayload,
  ): Promise<ProjectPresenceAck> {
    const user = requireSocketUser(client);

    await this.userProjectsService.requireMember(user.id, body.projectId);
    await client.join(getProjectRoom(body.projectId));
    this.addPresence(body.projectId, user.id, client.id);

    const onlineUsers = await this.emitOnlineUsers(body.projectId);

    return { projectId: body.projectId, onlineUsers };
  }

  @SubscribeMessage(FrontendRealtimeEvent.PROJECT_LEAVE)
  async leaveProject(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: ProjectIdPayload,
  ): Promise<ProjectPresenceAck> {
    const user = requireSocketUser(client);

    if (!this.socketProjects.get(client.id)?.has(body.projectId)) {
      return { projectId: body.projectId, onlineUsers: [] };
    }

    await client.leave(getProjectRoom(body.projectId));
    this.removePresence(body.projectId, user.id, client.id);
    const onlineUsers = await this.emitOnlineUsers(body.projectId);

    return { projectId: body.projectId, onlineUsers };
  }

  @SubscribeMessage(FrontendRealtimeEvent.PROJECT_RENAME)
  renameProject(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: RenameProjectPayload,
  ): Promise<Project | null> {
    const user = requireSocketUser(client);

    return this.projectsService.update(user.id, body.projectId, { name: body.name });
  }

  @SubscribeMessage(FrontendRealtimeEvent.PROJECT_DELETE)
  deleteProject(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: ProjectIdPayload,
  ): Promise<Project | null> {
    const user = requireSocketUser(client);

    return this.projectsService.delete(user.id, body.projectId);
  }

  @SubscribeMessage(FrontendRealtimeEvent.PARTICIPANT_UPDATE_ROLES)
  updateParticipantRoles(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: UpdateParticipantRolesPayload,
  ): Promise<UserProject> {
    const user = requireSocketUser(client);

    return this.projectsService.updateMemberRoles(user.id, body.projectId, body.memberId, body.role);
  }

  @SubscribeMessage(FrontendRealtimeEvent.PARTICIPANT_REMOVE)
  removeParticipant(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() body: RemoveParticipantPayload,
  ): Promise<UserProject | null> {
    const user = requireSocketUser(client);

    return this.projectsService.removeMember(user.id, body.projectId, body.memberId);
  }

  emitProjectUpdated(projectId: string, project: Project | null) {
    this.emitToProject(projectId, RealtimeEvent.PROJECT_UPDATED, project);
  }

  emitProjectRenamed(projectId: string, project: Project) {
    this.emitToProject(projectId, RealtimeEvent.PROJECT_RENAMED, project);
  }

  emitProjectDeleted(projectId: string, project: Project | null) {
    this.emitToProject(projectId, RealtimeEvent.PROJECT_DELETED, project);
  }

  emitParticipantRolesUpdated(projectId: string, member: UserProject) {
    this.emitToProject(projectId, RealtimeEvent.PARTICIPANT_ROLES_UPDATED, member);
  }

  async emitParticipantRemoved(projectId: string, memberId: string, member: UserProject | null) {
    const payload: ParticipantRemovedPayload = {
      projectId,
      userId: memberId,
      member,
    };

    this.emitToProject(projectId, RealtimeEvent.PARTICIPANT_REMOVED, payload);

    await this.removeUserFromProjectRoom(projectId, memberId);
  }

  emitToProject<TEvent extends RealtimeEvent>(projectId: string, event: TEvent, payload: ServerEventPayload<TEvent>) {
    const room = this.server?.to(getProjectRoom(projectId)) as RealtimeRoomEmitter | undefined;
    room?.emit(event, payload);
  }

  private async removeUserFromProjectRoom(projectId: string, userId: string) {
    const socketIds = this.projectUserSockets.get(projectId)?.get(userId);

    if (!socketIds?.size) {
      return;
    }

    for (const socketId of [...socketIds]) {
      const socket = this.server?.sockets.sockets.get(socketId);

      await socket?.leave(getProjectRoom(projectId));
      const socketProjectIds = this.socketProjects.get(socketId);
      socketProjectIds?.delete(projectId);

      if (socketProjectIds && socketProjectIds.size === 0) {
        this.socketProjects.delete(socketId);
      }
    }

    const projectSockets = this.projectUserSockets.get(projectId);
    projectSockets?.delete(userId);

    if (projectSockets && projectSockets.size === 0) {
      this.projectUserSockets.delete(projectId);
    }

    await this.emitOnlineUsers(projectId);
  }

  private addPresence(projectId: string, userId: string, socketId: string) {
    if (!this.socketProjects.has(socketId)) {
      this.socketProjects.set(socketId, new Set());
    }

    this.socketProjects.get(socketId)?.add(projectId);

    if (!this.projectUserSockets.has(projectId)) {
      this.projectUserSockets.set(projectId, new Map());
    }

    const projectSockets = this.projectUserSockets.get(projectId);

    if (!projectSockets?.has(userId)) {
      projectSockets?.set(userId, new Set());
    }

    projectSockets?.get(userId)?.add(socketId);
  }

  private removePresence(projectId: string, userId: string, socketId: string) {
    const socketProjectIds = this.socketProjects.get(socketId);
    socketProjectIds?.delete(projectId);

    if (socketProjectIds && socketProjectIds.size === 0) {
      this.socketProjects.delete(socketId);
    }

    const projectSockets = this.projectUserSockets.get(projectId);
    const userSockets = projectSockets?.get(userId);

    userSockets?.delete(socketId);

    if (userSockets && userSockets.size === 0) {
      projectSockets?.delete(userId);
    }

    if (projectSockets && projectSockets.size === 0) {
      this.projectUserSockets.delete(projectId);
    }
  }

  private async emitOnlineUsers(projectId: string): Promise<OnlineUser[]> {
    const onlineUsers = await this.getOnlineUsers(projectId);
    this.emitToProject(projectId, RealtimeEvent.PROJECT_ONLINE_USERS, {
      projectId,
      users: onlineUsers,
    });

    return onlineUsers;
  }

  private async getOnlineUsers(projectId: string): Promise<OnlineUser[]> {
    const onlineUserIds = this.projectUserSockets.get(projectId);

    if (!onlineUserIds?.size) {
      return [];
    }

    const members = await this.userProjectsService.listProjectMembers(projectId);

    return members
      .map((member) => this.toOnlineUser(member, onlineUserIds))
      .filter((user): user is OnlineUser => Boolean(user));
  }

  private toOnlineUser(
    member: UserProjectWithMaybePopulatedUser,
    onlineUserIds: Map<string, Set<string>>,
  ): OnlineUser | null {
    const user = member.userId instanceof Types.ObjectId ? undefined : member.userId;
    const userId = String(user?._id ?? member.userId);
    const sockets = onlineUserIds.get(userId);

    if (!sockets?.size) {
      return null;
    }

    return {
      userId,
      membershipId: member.id,
      name: user?.name,
      email: user?.email,
      avatar: user?.avatar,
      socketCount: sockets.size,
    };
  }
}
