export type EntityId = string;

export enum TokenType {
  REFRESH = 'refresh',
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum InvitationRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum RealtimeEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_MOVED = 'task.moved',
  PARTICIPANT_ROLES_UPDATED = 'participant.roles_updated',
}

export interface Token {
  id: EntityId;
  userId: EntityId;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  user?: User;
}

export interface User {
  id: EntityId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;

  tokens?: Token[];
  projects?: Project[];
  sentInvitations?: Invitation[];
  receivedInvitations?: Invitation[];
}

export interface Project {
  id: EntityId;
  name: string;
  description?: string | null;
  ownerId: EntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  owner?: User;
  userProjects?: UserProject[];
  collaborators?: User[];
  tasks?: Task[];
  invitations?: Invitation[];
}

export interface Task {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  createdByUserId: EntityId;
  assignedToUserId?: EntityId | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  project?: Project;
  createdBy?: User;
  assignedTo?: User;
}

export interface UserProject {
  id: EntityId;
  userId: EntityId;
  projectId: EntityId;
  role: ProjectRole[];
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  user?: User;
  project?: Project;
}

export interface Invitation {
  id: EntityId;
  projectId: EntityId;
  invitedByUserId: EntityId;
  invitedUserId?: EntityId | null;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  declinedAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  project?: Project;
  invitedBy?: User;
  invitedUser?: User;
}
