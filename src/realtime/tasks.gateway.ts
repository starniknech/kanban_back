import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RealtimeEvent } from '../common/enums/domain.enums';
import { getProjectRoom, REALTIME_GATEWAY_OPTIONS } from './realtime.constants';

@Injectable()
@WebSocketGateway(REALTIME_GATEWAY_OPTIONS)
export class RealtimeTasksGateway {
  @WebSocketServer()
  server: Server;

  emitCreated(projectId: string, task: unknown) {
    this.emitToProject(projectId, RealtimeEvent.TASK_CREATED, task);
  }

  emitUpdated(projectId: string, task: unknown) {
    this.emitToProject(projectId, RealtimeEvent.TASK_UPDATED, task);
  }

  emitMoved(projectId: string, task: unknown) {
    this.emitToProject(projectId, RealtimeEvent.TASK_MOVED, task);
  }

  emitDeleted(projectId: string, task: unknown) {
    this.emitToProject(projectId, RealtimeEvent.TASK_DELETED, task);
  }

  private emitToProject(projectId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(getProjectRoom(projectId)).emit(event, payload);
  }
}
