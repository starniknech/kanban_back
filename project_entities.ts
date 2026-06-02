export type EntityId = string;

export type UserRole = 'user' | 'admin';

export type OAuthProvider = 'google' | 'github';

export type TokenType = 'refresh' | 'password-reset';

export type ProjectRole = 'owner' | 'admin' | 'member';

export type InvitationRole = Exclude<ProjectRole, 'owner'>;

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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
  passwordHash?: string | null;
  oauthProvider?: OAuthProvider | null;
  oauthId?: string | null;
  roles: UserRole[];
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
  role: ProjectRole;
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
  tokenHash: string;
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