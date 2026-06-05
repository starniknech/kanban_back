import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { RealtimeEvent } from '../common/enums/domain.enums';
import { UserProject } from '../user-projects/user-projects.model';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UserProject.name)
    private readonly userProjectModel: Model<UserProject>,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      });
      client.data.user = { id: payload.sub, email: payload.email };
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('project.join')
  async joinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId: string },
  ) {
    const userId = client.data.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Missing socket user');
    }

    const membership = await this.userProjectModel
      .findOne({
        userId: this.toObjectId(userId),
        projectId: this.toObjectId(body.projectId),
      })
      .exec();

    if (!membership) {
      throw new UnauthorizedException('You are not a project participant');
    }

    await client.join(this.getProjectRoom(body.projectId));
    return { projectId: body.projectId };
  }

  emitToProject(projectId: string, event: RealtimeEvent, payload: unknown) {
    this.server?.to(this.getProjectRoom(projectId)).emit(event, payload);
  }

  private getProjectRoom(projectId: string) {
    return `project:${projectId}`;
  }

  private toObjectId(id: string): Types.ObjectId {
    return new Types.ObjectId(id);
  }
}
