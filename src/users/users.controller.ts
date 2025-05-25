import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { Express } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('avatar'))
  async create(
    @Body() body: Record<string, any>,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.create(body, avatar);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.update(id, body, avatar);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch(':id/tasks/:taskId')
  async assignTask(
    @Param('id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.usersService.assignTask(userId, taskId);
  }
}
