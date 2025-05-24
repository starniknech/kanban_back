// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FileModule } from './file/file.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.development.env' : undefined,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI),
    TasksModule,
    UsersModule,
    FileModule,
  ],
})
export class AppModule {}
