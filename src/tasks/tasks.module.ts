import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './tasks.model';
import { UserProjectsModule } from '../user-projects/user-projects.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    UserProjectsModule,
    RealtimeModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
