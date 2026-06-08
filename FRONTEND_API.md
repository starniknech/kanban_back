# Frontend API and Realtime Reference

This document describes the existing HTTP API and Socket.IO realtime contract exposed by this backend. It is intended for frontend integration and mirrors the current code without changing backend behavior.

## Base Setup

- HTTP base URL: the Nest app listens on `process.env.PORT`; there is no global API prefix.
- Static files: avatar files are served from `/uploads/...`.
- Authenticated HTTP requests use:

```http
Authorization: Bearer <accessToken>
```

- JSON requests use `Content-Type: application/json`, except `PATCH /users/:id`, which accepts `multipart/form-data` when uploading an avatar.
- Access tokens expire after 15 minutes. Refresh tokens expire after 30 days and are rotated on refresh.
- Validation strips unknown request fields because the app uses Nest `ValidationPipe` with `whitelist: true`.

## Shared Types

MongoDB documents are returned as Mongoose JSON. Examples below use `_id`; responses may also include `createdAt`, `updatedAt`, and `__v`.

### Enums

```ts
type ProjectRole = 'owner' | 'admin' | 'member';
type InvitationRole = 'admin' | 'member';
type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
type NotificationStatus = 'read' | 'unread';
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### User

```ts
type User = {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
};
```

Note: `GET /users`, `GET /users/me`, and `GET /users/:id` exclude `passwordHash`. The current `PATCH /users/:id` and `DELETE /users/:id` service responses do not explicitly exclude it.

### Auth Tokens

```ts
type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
```

### Project

```ts
type Project = {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
```

### Project Member

`GET /projects/:projectId/members` populates `userId` with basic user details:

```ts
type ProjectMember = {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
      };
  projectId: string;
  role: ProjectRole[];
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
};
```

Task assignees use the same project membership documents. In task write payloads, send membership ids in `assignees`. In task responses, the backend populates each assignee's `userId`.

Role normalization is backend-driven:

- Sending `['owner']` stores `['member', 'admin', 'owner']`.
- Sending `['admin']` stores `['member', 'admin']`.
- Anything else stores `['member']`.

### Task

```ts
type Task = {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  createdByUserId: string;
  assignees: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    projectId: string;
    role: ProjectRole[];
    joinedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
```

### Invitation

```ts
type Invitation = {
  _id: string;
  projectId: string;
  invitedByUserId: string;
  invitedUserId?: string | null;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  notificationStatus: NotificationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
```

## Auth Endpoints

These endpoints do not require an access token.

### `POST /auth/register`

Creates a user and returns tokens.

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secret123"
}
```

Validation:

- `name`: string, minimum length 2
- `email`: valid email
- `password`: string, minimum length 6

Response:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### `POST /auth/login`

Authenticates an existing user.

Request:

```json
{
  "email": "ada@example.com",
  "password": "secret123"
}
```

Response: `AuthTokens`.

### `POST /auth/refresh`

Revokes the submitted refresh token and returns a new token pair.

Request:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Response: `AuthTokens`.

### `POST /auth/logout`

Revokes the submitted refresh token. If the token is invalid, the backend still returns success.

Request:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Response:

```json
{
  "success": true
}
```

## User Endpoints

All user endpoints require `Authorization: Bearer <accessToken>`.

### `GET /users`

Lists all users.

Response:

```json
[
  {
    "_id": "665f0ad42c4e6d0012a00001",
    "email": "ada@example.com",
    "name": "Ada Lovelace",
    "avatar": "/uploads/avatars/default-ava.webp"
  }
]
```

### `GET /users/me`

Returns the authenticated user.

Response: `User | null`.

### `GET /users/:id`

Returns a user by id.

Path params:

- `id`: user MongoDB id

Response: `User | null`.

### `PATCH /users/:id`

Updates the authenticated user's own profile. The backend rejects updates for any other user id.

Path params:

- `id`: authenticated user MongoDB id

Request as JSON:

```json
{
  "name": "Ada Byron",
  "email": "ada.byron@example.com"
}
```

Request as multipart form data:

```text
name=Ada Byron
email=ada.byron@example.com
avatar=<file field named "avatar">
```

Validation:

- `name`: optional string, minimum length 2
- `email`: optional valid email
- `avatar`: optional uploaded file

Response: updated user document.

### `DELETE /users/:id`

Deletes the authenticated user's own account. The backend rejects deletes for any other user id.

Path params:

- `id`: authenticated user MongoDB id

Response: deleted user document or `null`.

## Project Endpoints

All project endpoints require `Authorization: Bearer <accessToken>`.

### `POST /projects`

Creates a project owned by the authenticated user. The backend also creates owner membership with roles `['member', 'admin', 'owner']`.

Request:

```json
{
  "name": "Launch Board",
  "description": "Tasks for the release"
}
```

Validation:

- `name`: string, minimum length 2
- `description`: optional string

Response: `Project`.

### `GET /projects`

Lists non-deleted projects where the authenticated user has membership.

Response: `Project[]`.

### `GET /projects/:projectId`

Returns a project if the authenticated user is a member.

Path params:

- `projectId`: project MongoDB id

Response: `Project`.

### `PATCH /projects/:projectId`

Updates a project. Requires the authenticated user to have `admin` role.

Request:

```json
{
  "name": "Launch Board v2",
  "description": "Updated release tasks"
}
```

Validation:

- `name`: optional string, minimum length 2
- `description`: optional string

Response: updated `Project | null`.

Realtime side effect:

- Emits `project.updated` to the project room with the updated project.
- Emits `project.renamed` to the project room when `name` is present in the update payload.

### `DELETE /projects/:projectId`

Soft-deletes a project by setting `deletedAt`. Requires `owner` role.

Response: updated `Project | null`.

### `GET /projects/:projectId/members`

Lists project memberships. Requires project membership.

Response:

```json
[
  {
    "_id": "665f0b202c4e6d0012b00001",
    "userId": {
      "_id": "665f0ad42c4e6d0012a00001",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "avatar": "/uploads/avatars/default-ava.webp"
    },
    "projectId": "665f0b102c4e6d0012b00000",
    "role": ["member", "admin", "owner"],
    "joinedAt": "2026-06-05T10:00:00.000Z"
  }
]
```

### `PATCH /projects/:projectId/members/:memberId/roles`

Updates a project participant's roles. Requires the authenticated user to have `owner` role.

Path params:

- `projectId`: project MongoDB id
- `memberId`: user MongoDB id of the project participant

Request:

```json
{
  "role": ["admin"]
}
```

Validation:

- `role`: non-empty array of `ProjectRole`

Response: updated `ProjectMember`.

Realtime side effect:

- Emits `participant.roles_updated` to the project room with the updated membership.

### `DELETE /projects/:projectId/members/:memberId`

Removes a project participant. Requires `owner` role. Owners cannot remove themselves.

Response: removed `ProjectMember | null`.

Realtime side effect:

- Emits `participant.removed` to the project room with `{ projectId, userId, member }`.
- Removes that user's active sockets from the project room and emits a fresh `project.online_users` list.

## Task Endpoints

All task endpoints require `Authorization: Bearer <accessToken>` and project membership, except delete, which requires `admin` role.

### `POST /projects/:projectId/tasks`

Creates a task in the project.

Request:

```json
{
  "title": "Design review",
  "description": "Check board interactions",
  "status": "todo",
  "priority": "high",
  "position": 0,
  "assignees": ["665f0b202c4e6d0012b00001"],
  "dueDate": "2026-06-12T12:00:00.000Z"
}
```

Validation:

- `title`: string, minimum length 2
- `description`: optional string
- `status`: optional `TaskStatus`; default is `todo`
- `priority`: optional `TaskPriority`; default is `medium`
- `position`: optional number, minimum 0; default is `0`
- `assignees`: optional array of MongoDB ids from project membership documents (`UserProject`)
- `dueDate`: optional ISO date string

Response: `Task`.

Realtime side effect:

- Emits `task.created` to the project room with the created task.

### `GET /projects/:projectId/tasks`

Lists tasks for a project, sorted by `position` ascending.

Response: `Task[]`.

### `GET /projects/:projectId/tasks/:id`

Returns one task from the project.

Path params:

- `projectId`: project MongoDB id
- `id`: task MongoDB id

Response: `Task | null`.

### `PATCH /projects/:projectId/tasks/:id`

Updates a task.

Request:

```json
{
  "title": "Design review complete",
  "status": "review",
  "priority": "urgent",
  "assignees": ["665f0b202c4e6d0012b00001", "665f0b202c4e6d0012b00002"],
  "dueDate": "2026-06-13T15:00:00.000Z"
}
```

Validation is the same as create, but all fields are optional and `title`, when present, has minimum length 2.

Response: updated `Task | null`.

Realtime side effect:

- Emits `task.updated` to the project room with the updated task, or `null` if no task matched.

### `PATCH /projects/:projectId/tasks/:id/move`

Moves/reorders a task by updating `status` and/or `position`.

Request:

```json
{
  "status": "in_progress",
  "position": 2
}
```

Validation:

- `status`: optional `TaskStatus`
- `position`: optional number, minimum 0

Response: updated `Task | null`.

Realtime side effect:

- Emits `task.moved` to the project room with the moved task, or `null` if no task matched.

### `DELETE /projects/:projectId/tasks/:id`

Deletes a task. Requires `admin` role.

Response: deleted `Task | null`.

Realtime side effect:

- Emits `task.deleted` to the project room with the deleted task, or `null` if no task matched.

## Invitation Endpoints

All invitation endpoints require `Authorization: Bearer <accessToken>`.

### `POST /projects/:projectId/invitations`

Creates an invitation. Requires `admin` role. Inviting another admin requires `owner` role.

Request:

```json
{
  "email": "grace@example.com",
  "role": "member"
}
```

Validation:

- `email`: valid email
- `role`: `admin` or `member`

Response: `Invitation` with `status: 'pending'` and `expiresAt` 7 days after creation.

Realtime side effect:

- Emits `invitation.created` to the project room with the created invitation.

### `GET /projects/:projectId/invitations`

Lists all invitations for a project. Requires `admin` role.

Response: `Invitation[]`.

### `GET /invitations/my`

Lists pending invitations addressed to the authenticated user's user id or email address.

Response: `Invitation[]`.

### `PATCH /invitations/:invitationId/notification-status`

Updates the notification status for an invitation addressed to the authenticated user's user id or email address.

Request:

```json
{
  "notificationStatus": "read"
}
```

Validation:

- `notificationStatus`: `read` or `unread`

Response: updated `Invitation` with the requested `notificationStatus`.

### `PATCH /invitations/:invitationId/accept`

Accepts a pending invitation for the authenticated user's email.

Response: updated `Invitation` with `status: 'accepted'` and `acceptedAt`.

Side effect:

- Creates project membership with `['member']` for member invitations or `['member', 'admin']` for admin invitations.
- Emits `invitation.accepted` to the project room with the accepted invitation.

### `PATCH /invitations/:invitationId/decline`

Declines a pending invitation for the authenticated user's email.

Response: updated `Invitation` with `status: 'declined'` and `declinedAt`.

Realtime side effect:

- Emits `invitation.declined` to the project room with the declined invitation.

### `PATCH /projects/:projectId/invitations/:invitationId/cancel`

Cancels an invitation. Requires `admin` role.

Response: updated `Invitation` with `status: 'cancelled'` and `cancelledAt`.

Realtime side effect:

- Emits `invitation.cancelled` to the project room with the cancelled invitation.

## Realtime API

The backend uses Socket.IO with CORS origin `process.env.FRONTEND_URL || '*'`.

### Connect

Send the access token in Socket.IO auth:

```ts
import { io } from 'socket.io-client';

const socket = io(API_ORIGIN, {
  auth: {
    token: accessToken,
  },
});
```

If the token is missing or invalid, the server disconnects the socket.

### Client-To-Server Events

#### `dashboard.join`

Direction: frontend -> backend

Joins the authenticated socket to dashboard rooms for the current user id and email. Use this on the dashboard page to receive invitation notifications that are not tied to an opened project page.

Payload: none.

Example:

```ts
socket.emit('dashboard.join', (ack: { invitations: Invitation[] }) => {
  setInvitations(ack.invitations);
});
```

Acknowledgement:

```ts
{
  invitations: Invitation[];
}
```

#### `dashboard.leave`

Direction: frontend -> backend

Leaves the authenticated user's dashboard rooms.

Payload: none.

Acknowledgement:

```ts
{
  ok: true;
}
```

#### `project.join`

Direction: frontend -> backend

Joins the authenticated socket to a project room. The user must be a project participant.

Payload:

```ts
{
  projectId: string;
}
```

Example:

```ts
socket.emit('project.join', { projectId }, (ack: { projectId: string }) => {
  console.log('joined project room', ack.projectId);
});
```

Acknowledgement:

```json
{
  "projectId": "665f0b102c4e6d0012b00000",
  "onlineUsers": [
    {
      "userId": "665f0ad42c4e6d0012a00001",
      "membershipId": "665f0b202c4e6d0012b00001",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "avatar": "/uploads/avatars/default-ava.webp",
      "socketCount": 1
    }
  ]
}
```

#### `project.leave`

Direction: frontend -> backend

Leaves a project room and updates the online users list.

Payload:

```ts
{
  projectId: string;
}
```

Acknowledgement:

```json
{
  "projectId": "665f0b102c4e6d0012b00000",
  "onlineUsers": []
}
```

### Server-To-Client Events

Project-scoped events are emitted to sockets that have joined the affected project room with `project.join`. Invitation events are also emitted to the invited user's dashboard rooms after `dashboard.join`.

#### `dashboard.invitations`

Direction: backend -> frontend

Emitted immediately after `dashboard.join` with the current pending invitations for the authenticated user.

Payload:

```ts
{
  invitations: Invitation[];
}
```

#### `project.online_users`

Direction: backend -> frontend

Emitted after `project.join`, `project.leave`, socket disconnects, and participant removal.

Payload:

```ts
{
  projectId: string;
  users: Array<{
    userId: string;
    membershipId: string;
    name?: string;
    email?: string;
    avatar?: string;
    socketCount: number;
  }>;
}
```

#### `project.updated`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId`.

Payload: updated `Project`.

#### `project.renamed`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId` when the update payload includes `name`.

Payload: updated `Project`.

#### `project.deleted`

Direction: backend -> frontend

Emitted after `DELETE /projects/:projectId` or `project.delete`.

Payload: deleted `Project | null`.

#### `task.created`

Direction: backend -> frontend

Emitted after `POST /projects/:projectId/tasks`.

Payload: created `Task`.

Example:

```ts
socket.on('task.created', (task: Task) => {
  upsertTask(task);
});
```

#### `task.updated`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId/tasks/:id`.

Payload: updated `Task | null`.

Example:

```ts
socket.on('task.updated', (task: Task | null) => {
  if (task) upsertTask(task);
});
```

#### `task.deleted`

Direction: backend -> frontend

Emitted after `DELETE /projects/:projectId/tasks/:id`.

Payload: deleted `Task | null`.

Example:

```ts
socket.on('task.deleted', (task: Task | null) => {
  if (task) removeTask(task._id);
});
```

#### `task.moved`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId/tasks/:id/move`.

Payload: moved `Task | null`.

Example:

```ts
socket.on('task.moved', (task: Task | null) => {
  if (task) upsertTask(task);
});
```

#### `participant.roles_updated`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId/members/:memberId/roles`.

Payload: updated `ProjectMember`. This update response is not populated with user details.

Example:

```ts
socket.on('participant.roles_updated', (member: ProjectMember) => {
  updateMemberRoles(member.userId, member.role);
});
```

#### `participant.removed`

Direction: backend -> frontend

Emitted after `DELETE /projects/:projectId/members/:memberId`.

Payload:

```ts
{
  projectId: string;
  userId: string;
  member: ProjectMember | null;
}
```

The removed user's sockets receive this event before the backend removes them from the project room.

#### `invitation.created`

Direction: backend -> frontend

Emitted after `POST /projects/:projectId/invitations` or `invitation.create`.

Payload: created `Invitation`.

Rooms: project room and invited user's dashboard rooms.

#### `invitation.updated`

Direction: backend -> frontend

Emitted after `invitation.update` or `invitation.update_notification_status`.

Payload: updated `Invitation`.

Rooms: project room and invited user's dashboard rooms.

#### `invitation.accepted`

Direction: backend -> frontend

Emitted after `PATCH /invitations/:invitationId/accept`.

Payload: accepted `Invitation`.

Rooms: project room and invited user's dashboard rooms.

#### `invitation.declined`

Direction: backend -> frontend

Emitted after `PATCH /invitations/:invitationId/decline`.

Payload: declined `Invitation`.

Rooms: project room and invited user's dashboard rooms.

#### `invitation.cancelled`

Direction: backend -> frontend

Emitted after `PATCH /projects/:projectId/invitations/:invitationId/cancel`.

Payload: cancelled `Invitation`.

Rooms: project room and invited user's dashboard rooms.

## Error Shape

Nest default error responses generally look like:

```json
{
  "message": "Invalid access token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Common statuses from the current code:

- `400`: validation failures or duplicate registration email
- `401`: missing/invalid access token, invalid refresh token, missing socket user
- `403`: insufficient project role, non-member access, invitation belongs to another user, profile ownership checks
- `404`: missing project participant, project not found, invitation not found/expired

## Backend-Listened Realtime Events

These Socket.IO events are emitted by the frontend and handled by the backend. Each handler uses the same auth token from `socket.auth.token`, applies the same role checks as the REST endpoint, returns the result in the acknowledgement, and then emits the matching backend -> frontend event to the relevant project and/or dashboard rooms.

### Dashboard

#### `dashboard.join`

Payload: none.

Ack:

```ts
{
  invitations: Invitation[];
}
```

Also emits `dashboard.invitations` to the joined socket.

#### `dashboard.leave`

Payload: none.

Ack:

```ts
{
  ok: true;
}
```

### Projects

#### `project.rename`

Payload:

```ts
{
  projectId: string;
  name: string;
}
```

Ack: updated `Project | null`.

Broadcasts: `project.updated` and `project.renamed`.

#### `project.delete`

Payload:

```ts
{
  projectId: string;
}
```

Ack: deleted `Project | null`.

Broadcasts: `project.deleted`.

### Participants

#### `participant.roles.update`

Payload:

```ts
{
  projectId: string;
  memberId: string;
  role: ProjectRole[];
}
```

Ack: updated `ProjectMember`.

Broadcasts: `participant.roles_updated`.

#### `participant.remove`

Payload:

```ts
{
  projectId: string;
  memberId: string;
}
```

Ack: removed `ProjectMember | null`.

Broadcasts: `participant.removed` and then `project.online_users`.

### Tasks

#### `task.create`

Payload:

```ts
{
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  assignees?: string[];
  dueDate?: string | Date;
}
```

Ack: created `Task`.

Broadcasts: `task.created`.

#### `task.update`

Payload:

```ts
{
  projectId: string;
  taskId: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  position?: number;
  assignees?: string[];
  dueDate?: string | Date;
}
```

Ack: updated `Task | null`.

Broadcasts: `task.updated`.

#### `task.move`

Payload:

```ts
{
  projectId: string;
  taskId: string;
  status?: TaskStatus;
  position?: number;
}
```

Ack: moved `Task | null`.

Broadcasts: `task.moved`.

#### `task.delete`

Payload:

```ts
{
  projectId: string;
  taskId: string;
}
```

Ack: deleted `Task | null`.

Broadcasts: `task.deleted`.

### Invitations

#### `invitation.create`

Payload:

```ts
{
  projectId: string;
  email: string;
  role: InvitationRole;
}
```

Ack: created `Invitation`.

Broadcasts: `invitation.created`.

#### `invitation.update_notification_status`

Payload:

```ts
{
  invitationId: string;
  notificationStatus: NotificationStatus;
}
```

Ack: updated `Invitation`.

Broadcasts: none.

#### `invitation.update`

Payload:

```ts
{
  projectId: string;
  invitationId: string;
  email?: string;
  role?: InvitationRole;
}
```

Ack: updated `Invitation`.

Broadcasts: `invitation.updated`.

#### `invitation.accept`

Payload:

```ts
{
  invitationId: string;
}
```

Ack: accepted `Invitation`.

Broadcasts: `invitation.accepted`.

#### `invitation.decline`

Payload:

```ts
{
  invitationId: string;
}
```

Ack: declined `Invitation`.

Broadcasts: `invitation.declined`.

#### `invitation.cancel`

Payload:

```ts
{
  projectId: string;
  invitationId: string;
}
```

Ack: cancelled `Invitation`.

Broadcasts: `invitation.cancelled`.

#### `invitation.delete`

Payload:

```ts
{
  projectId: string;
  invitationId: string;
}
```

Ack: cancelled `Invitation`.

Broadcasts: `invitation.cancelled`.
