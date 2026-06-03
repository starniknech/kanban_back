import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ProjectsModule } from './projects/projects.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TasksModule } from './tasks/tasks.module';
import { UserProjectsModule } from './user-projects/user-projects.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.development.env' : undefined,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI),
    AuthModule,
    TasksModule,
    UsersModule,
    FileModule,
    ProjectsModule,
    UserProjectsModule,
    InvitationsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
