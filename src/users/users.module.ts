import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './users.model';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FileModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
