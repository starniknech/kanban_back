// one export for compilation
export type EntityId = string;

enum TokenType {
  REFRESH = 'refresh',
}

enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

enum InvitationRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread',
}

enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

enum RealtimeEvent {
  PROJECT_ONLINE_USERS = 'project.online_users',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_RENAMED = 'project.renamed',
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_MOVED = 'task.moved',
  INVITATION_CREATED = 'invitation.created',
  INVITATION_ACCEPTED = 'invitation.accepted',
  INVITATION_DECLINED = 'invitation.declined',
  INVITATION_CANCELLED = 'invitation.cancelled',
  PARTICIPANT_ROLES_UPDATED = 'participant.roles_updated',
  PARTICIPANT_REMOVED = 'participant.removed',
}

interface Token {
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

interface User {
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

interface Project {
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

interface Task {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  createdByUserId: EntityId;
  assignees: EntityId[];
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  project?: Project;
  createdBy?: User;
  assigneeMemberships?: UserProject[];
}

interface UserProject {
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

interface Invitation {
  id: EntityId;
  projectId: EntityId;
  invitedByUserId: EntityId;
  invitedUserId?: EntityId | null;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  notificationStatus: NotificationStatus;
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
