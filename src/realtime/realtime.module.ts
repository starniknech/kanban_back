import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserProjectsModule } from '../user-projects/user-projects.module';
import { RealtimeInvitationsGateway } from './invitations.gateway';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeTasksGateway } from './tasks.gateway';

@Module({
  imports: [JwtModule.register({}), UserProjectsModule],
  providers: [RealtimeGateway, RealtimeTasksGateway, RealtimeInvitationsGateway],
  exports: [RealtimeGateway, RealtimeTasksGateway, RealtimeInvitationsGateway],
})
export class RealtimeModule {}
