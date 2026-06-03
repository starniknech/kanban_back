import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProject, UserProjectSchema } from './user-projects.model';
import { UserProjectsService } from './user-projects.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProject.name, schema: UserProjectSchema },
    ]),
  ],
  providers: [UserProjectsService],
  exports: [UserProjectsService, MongooseModule],
})
export class UserProjectsModule {}

