import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RealtimeEvent } from '../common/enums/domain.enums';
import { getProjectRoom, REALTIME_GATEWAY_OPTIONS } from './realtime.constants';

@Injectable()
@WebSocketGateway(REALTIME_GATEWAY_OPTIONS)
export class RealtimeInvitationsGateway {
  @WebSocketServer()
  server: Server;

  emitCreated(projectId: string, invitation: unknown) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_CREATED, invitation);
  }

  emitAccepted(projectId: string, invitation: unknown) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_ACCEPTED, invitation);
  }

  emitDeclined(projectId: string, invitation: unknown) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_DECLINED, invitation);
  }

  emitCancelled(projectId: string, invitation: unknown) {
    this.emitToProject(projectId, RealtimeEvent.INVITATION_CANCELLED, invitation);
  }

  private emitToProject(projectId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(getProjectRoom(projectId)).emit(event, payload);
  }
}
