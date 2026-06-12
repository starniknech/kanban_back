import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Invitation } from '../invitations/invitations.model';
import { Project } from '../projects/projects.model';
import { Task } from '../tasks/tasks.model';
import { UserProject } from '../user-projects/user-projects.model';
import {
  ErrorEnum,
  ErrorMessageEnum,
  FrontendRealtimeEvent,
  InvitationRole,
  NotificationStatus,
  ProjectRole,
  RealtimeEvent,
  TaskPriority,
  TaskStatus,
} from '../common/enums/domain.enums';

export type SocketUser = {
  id: string;
  email: string;
};

export type RealtimeSocketData = {
  user?: SocketUser;
};

export interface ErrorPayload {
  error: ErrorEnum;
  message: ErrorMessageEnum;
  statusCode: number;
}

export type DashboardInvitationsPayload = {
  invitations: Invitation[];
};

export type ProjectIdPayload = {
  projectId: string;
};

export type TaskInputPayload = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  assignees?: string[];
  dueDate?: string | Date;
};

export type CreateTaskPayload = ProjectIdPayload &
  TaskInputPayload & {
    title: string;
  };

export type UpdateTaskPayload = ProjectIdPayload &
  TaskInputPayload & {
    taskId: string;
  };

export type MoveTaskPayload = ProjectIdPayload & {
  taskId: string;
  status?: TaskStatus;
  position?: number;
};

export type DeleteTaskPayload = ProjectIdPayload & {
  taskId: string;
};

export type CreateInvitationPayload = ProjectIdPayload & {
  email: string;
  role: InvitationRole;
};

export type UpdateInvitationPayload = ProjectIdPayload & {
  invitationId: string;
  email?: string;
  role?: InvitationRole;
};

export type UpdateInvitationNotificationStatusPayload = {
  invitationId: string;
  notificationStatus: NotificationStatus;
};

export type InvitationActionPayload = {
  invitationId: string;
};

export type CancelInvitationPayload = ProjectIdPayload & InvitationActionPayload;

export type RenameProjectPayload = ProjectIdPayload & {
  name: string;
};

export type UpdateParticipantRolesPayload = ProjectIdPayload & {
  memberId: string;
  role: ProjectRole[];
};

export type RemoveParticipantPayload = ProjectIdPayload & {
  memberId: string;
};

export type OnlineUser = {
  userId: string;
  membershipId: string;
  name?: string;
  email?: string;
  avatar?: string;
  socketCount: number;
};

export type ProjectOnlineUsersPayload = ProjectIdPayload & {
  users: OnlineUser[];
};

export type ProjectPresenceAck = ProjectIdPayload & {
  onlineUsers: OnlineUser[];
};

export type ParticipantRemovedPayload = ProjectIdPayload & {
  userId: string;
  member: UserProject | null;
};

export type ServerToClientEvents = {
  [RealtimeEvent.ERROR]: (payload: ErrorPayload) => void;
  [RealtimeEvent.DASHBOARD_INVITATIONS]: (payload: DashboardInvitationsPayload) => void;
  [RealtimeEvent.PROJECT_ONLINE_USERS]: (payload: ProjectOnlineUsersPayload) => void;
  [RealtimeEvent.PROJECT_UPDATED]: (payload: Project | null) => void;
  [RealtimeEvent.PROJECT_RENAMED]: (payload: Project) => void;
  [RealtimeEvent.PROJECT_DELETED]: (payload: Project | null) => void;
  [RealtimeEvent.TASK_CREATED]: (payload: Task) => void;
  [RealtimeEvent.TASK_UPDATED]: (payload: Task | null) => void;
  [RealtimeEvent.TASK_DELETED]: (payload: Task | null) => void;
  [RealtimeEvent.TASK_MOVED]: (payload: Task | null) => void;
  [RealtimeEvent.INVITATION_CREATED]: (payload: Invitation) => void;
  [RealtimeEvent.INVITATION_UPDATED]: (payload: Invitation) => void;
  [RealtimeEvent.INVITATION_ACCEPTED]: (payload: Invitation) => void;
  [RealtimeEvent.INVITATION_DECLINED]: (payload: Invitation) => void;
  [RealtimeEvent.INVITATION_CANCELLED]: (payload: Invitation) => void;
  [RealtimeEvent.PARTICIPANT_ROLES_UPDATED]: (payload: UserProject) => void;
  [RealtimeEvent.PARTICIPANT_REMOVED]: (payload: ParticipantRemovedPayload) => void;
};

export type ServerEventPayload<TEvent extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[TEvent]>[0];

export type ClientToServerEvents = {
  [FrontendRealtimeEvent.DASHBOARD_JOIN]: (ack?: (response: DashboardInvitationsPayload) => void) => void;
  [FrontendRealtimeEvent.DASHBOARD_LEAVE]: (ack?: (response: { ok: true }) => void) => void;
  [FrontendRealtimeEvent.PROJECT_JOIN]: (
    payload: ProjectIdPayload,
    ack?: (response: ProjectPresenceAck) => void,
  ) => void;
  [FrontendRealtimeEvent.PROJECT_LEAVE]: (
    payload: ProjectIdPayload,
    ack?: (response: ProjectPresenceAck) => void,
  ) => void;
  [FrontendRealtimeEvent.PROJECT_RENAME]: (
    payload: RenameProjectPayload,
    ack?: (response: Project | null) => void,
  ) => void;
  [FrontendRealtimeEvent.PROJECT_DELETE]: (payload: ProjectIdPayload, ack?: (response: Project | null) => void) => void;
  [FrontendRealtimeEvent.TASK_CREATE]: (payload: CreateTaskPayload, ack?: (response: Task) => void) => void;
  [FrontendRealtimeEvent.TASK_UPDATE]: (payload: UpdateTaskPayload, ack?: (response: Task | null) => void) => void;
  [FrontendRealtimeEvent.TASK_DELETE]: (payload: DeleteTaskPayload, ack?: (response: Task | null) => void) => void;
  [FrontendRealtimeEvent.TASK_MOVE]: (payload: MoveTaskPayload, ack?: (response: Task | null) => void) => void;
  [FrontendRealtimeEvent.INVITATION_CREATE]: (
    payload: CreateInvitationPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_UPDATE]: (
    payload: UpdateInvitationPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_UPDATE_NOTIFICATION_STATUS]: (
    payload: UpdateInvitationNotificationStatusPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_ACCEPT]: (
    payload: InvitationActionPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_DECLINE]: (
    payload: InvitationActionPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_CANCEL]: (
    payload: CancelInvitationPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.INVITATION_DELETE]: (
    payload: CancelInvitationPayload,
    ack?: (response: Invitation) => void,
  ) => void;
  [FrontendRealtimeEvent.PARTICIPANT_UPDATE_ROLES]: (
    payload: UpdateParticipantRolesPayload,
    ack?: (response: UserProject) => void,
  ) => void;
  [FrontendRealtimeEvent.PARTICIPANT_REMOVE]: (
    payload: RemoveParticipantPayload,
    ack?: (response: UserProject | null) => void,
  ) => void;
};

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
>;

export type RealtimeRoomEmitter = {
  emit<TEvent extends keyof ServerToClientEvents>(event: TEvent, payload: ServerEventPayload<TEvent>): void;
};

export function getSocketUser(client: RealtimeSocket): SocketUser | undefined {
  return client.data.user;
}

export function requireSocketUser(client: RealtimeSocket): SocketUser {
  const user = getSocketUser(client);

  if (!user) {
    throw new UnauthorizedException('Missing socket user');
  }

  return user;
}
