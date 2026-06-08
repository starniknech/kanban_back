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
  DASHBOARD_INVITATIONS = 'dashboard.invitations',
  PROJECT_ONLINE_USERS = 'project.online_users',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_RENAMED = 'project.renamed',
  PROJECT_DELETED = 'project.deleted',
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_MOVED = 'task.moved',
  INVITATION_CREATED = 'invitation.created',
  INVITATION_UPDATED = 'invitation.updated',
  INVITATION_ACCEPTED = 'invitation.accepted',
  INVITATION_DECLINED = 'invitation.declined',
  INVITATION_CANCELLED = 'invitation.cancelled',
  PARTICIPANT_ROLES_UPDATED = 'participant.roles_updated',
  PARTICIPANT_REMOVED = 'participant.removed',
}

export enum FrontendRealtimeEvent {
  DASHBOARD_JOIN = 'dashboard.join',
  DASHBOARD_LEAVE = 'dashboard.leave',
  PROJECT_JOIN = 'project.join',
  PROJECT_LEAVE = 'project.leave',
  PROJECT_RENAME = 'project.rename',
  PROJECT_DELETE = 'project.delete',
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_DELETE = 'task.delete',
  TASK_MOVE = 'task.move',
  INVITATION_CREATE = 'invitation.create',
  INVITATION_UPDATE = 'invitation.update',
  INVITATION_UPDATE_NOTIFICATION_STATUS = 'invitation.update_notification_status',
  INVITATION_ACCEPT = 'invitation.accept',
  INVITATION_DECLINE = 'invitation.decline',
  INVITATION_CANCEL = 'invitation.cancel',
  INVITATION_DELETE = 'invitation.delete',
  PARTICIPANT_UPDATE_ROLES = 'participant.roles.update',
  PARTICIPANT_REMOVE = 'participant.remove',
}
