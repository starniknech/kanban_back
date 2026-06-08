import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { FrontendRealtimeEvent, RealtimeEvent } from '../common/enums/domain.enums';
import { Task } from '../tasks/tasks.model';
import { TasksService } from '../tasks/tasks.service';
import { getProjectRoom, REALTIME_GATEWAY_OPTIONS } from './realtime.constants';
import {
  CreateTaskPayload,
  DeleteTaskPayload,
  MoveTaskPayload,
  RealtimeRoomEmitter,
  RealtimeServer,
  RealtimeSocket,
  requireSocketUser,
  ServerEventPayload,
  UpdateTaskPayload,
} from './realtime.types';

@Injectable()
@WebSocketGateway(REALTIME_GATEWAY_OPTIONS)
export class RealtimeTasksGateway {
  @WebSocketServer()
  server: RealtimeServer;

  constructor(
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
  ) {}

  @SubscribeMessage(FrontendRealtimeEvent.TASK_CREATE)
  createTask(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: CreateTaskPayload): Promise<Task> {
    const user = requireSocketUser(client);
    const { projectId, ...data } = body;

    return this.tasksService.create(user.id, projectId, data);
  }

  @SubscribeMessage(FrontendRealtimeEvent.TASK_UPDATE)
  updateTask(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: UpdateTaskPayload): Promise<Task | null> {
    const user = requireSocketUser(client);
    const { projectId, taskId, ...data } = body;

    return this.tasksService.update(user.id, projectId, taskId, data);
  }

  @SubscribeMessage(FrontendRealtimeEvent.TASK_MOVE)
  moveTask(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: MoveTaskPayload): Promise<Task | null> {
    const user = requireSocketUser(client);
    const { projectId, taskId, status, position } = body;

    return this.tasksService.move(user.id, projectId, taskId, { status, position });
  }

  @SubscribeMessage(FrontendRealtimeEvent.TASK_DELETE)
  deleteTask(@ConnectedSocket() client: RealtimeSocket, @MessageBody() body: DeleteTaskPayload): Promise<Task | null> {
    const user = requireSocketUser(client);

    return this.tasksService.delete(user.id, body.projectId, body.taskId);
  }

  emitCreated(projectId: string, task: Task) {
    this.emitToProject(projectId, RealtimeEvent.TASK_CREATED, task);
  }

  emitUpdated(projectId: string, task: Task | null) {
    this.emitToProject(projectId, RealtimeEvent.TASK_UPDATED, task);
  }

  emitMoved(projectId: string, task: Task | null) {
    this.emitToProject(projectId, RealtimeEvent.TASK_MOVED, task);
  }

  emitDeleted(projectId: string, task: Task | null) {
    this.emitToProject(projectId, RealtimeEvent.TASK_DELETED, task);
  }

  private emitToProject<TEvent extends RealtimeEvent>(
    projectId: string,
    event: TEvent,
    payload: ServerEventPayload<TEvent>,
  ) {
    const room = this.server?.to(getProjectRoom(projectId)) as RealtimeRoomEmitter | undefined;
    room?.emit(event, payload);
  }
}
