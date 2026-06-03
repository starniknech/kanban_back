import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserProject,
  UserProjectSchema,
} from '../user-projects/user-projects.model';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: UserProject.name, schema: UserProjectSchema },
    ]),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}

