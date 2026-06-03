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

