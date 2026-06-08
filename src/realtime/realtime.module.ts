import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvitationsModule } from '../invitations/invitations.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserProjectsModule } from '../user-projects/user-projects.module';
import { RealtimeInvitationsGateway } from './invitations.gateway';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeTasksGateway } from './tasks.gateway';

@Module({
  imports: [
    JwtModule.register({}),
    UserProjectsModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => TasksModule),
    forwardRef(() => InvitationsModule),
  ],
  providers: [RealtimeGateway, RealtimeTasksGateway, RealtimeInvitationsGateway],
  exports: [RealtimeGateway, RealtimeTasksGateway, RealtimeInvitationsGateway],
})
export class RealtimeModule {}
