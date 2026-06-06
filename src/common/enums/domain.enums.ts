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

export enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread',
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
