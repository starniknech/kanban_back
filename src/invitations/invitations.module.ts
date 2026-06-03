import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProjectsModule } from '../user-projects/user-projects.module';
import { UsersModule } from '../users/users.module';
import { Invitation, InvitationSchema } from './invitations.model';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
    ]),
    UserProjectsModule,
    UsersModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
