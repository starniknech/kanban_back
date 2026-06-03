import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './tasks.model';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUser } from '../common/auth/auth-user';
import { TaskStatus } from '../common/enums/domain.enums';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, projectId, body);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAll(user.id, projectId);
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.findById(user.id, projectId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, projectId, id, body);
  }

  @Patch(':id/move')
  async move(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() body: MoveTaskDto,
  ) {
    return this.tasksService.move(user.id, projectId, id, body);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.tasksService.delete(user.id, projectId, id);
  }
}
