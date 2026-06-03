import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './tasks.model';
import { Model, Types } from 'mongoose';
import { ProjectRole, RealtimeEvent, TaskStatus } from '../common/enums/domain.enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UserProjectsService } from '../user-projects/user-projects.service';

type TaskInput = Partial<
  Omit<Task, 'projectId' | 'createdByUserId' | 'assignedToUserId' | 'dueDate'>
> & {
  assignedToUserId?: string;
  dueDate?: string | Date;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly userProjectsService: UserProjectsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(userId: string, projectId: string, data: TaskInput) {
    await this.userProjectsService.requireMember(userId, projectId);

    const task = await this.taskModel.create({
      ...data,
      projectId: new Types.ObjectId(projectId),
      createdByUserId: new Types.ObjectId(userId),
      assignedToUserId: data.assignedToUserId
        ? new Types.ObjectId(data.assignedToUserId)
        : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    this.realtimeGateway.emitToProject(
      projectId,
      RealtimeEvent.TASK_CREATED,
      task,
    );

    return task;
  }

  async findAll(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.taskModel.find({ projectId }).sort({ position: 1 }).exec();
  }

  async findById(userId: string, projectId: string, id: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.taskModel.findOne({ _id: id, projectId }).exec();
  }

  async update(
    userId: string,
    projectId: string,
    id: string,
    data: TaskInput,
  ) {
    await this.userProjectsService.requireMember(userId, projectId);
    const updateData = {
      ...data,
      assignedToUserId: data.assignedToUserId
        ? new Types.ObjectId(data.assignedToUserId)
        : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };

    const task = await this.taskModel
      .findOneAndUpdate({ _id: id, projectId }, updateData, { new: true })
      .exec();

    this.realtimeGateway.emitToProject(
      projectId,
      RealtimeEvent.TASK_UPDATED,
      task,
    );

    return task;
  }

  async move(
    userId: string,
    projectId: string,
    id: string,
    data: { status?: TaskStatus; position?: number },
  ) {
    await this.userProjectsService.requireMember(userId, projectId);

    const task = await this.taskModel
      .findOneAndUpdate({ _id: id, projectId }, data, { new: true })
      .exec();

    this.realtimeGateway.emitToProject(
      projectId,
      RealtimeEvent.TASK_MOVED,
      task,
    );

    return task;
  }

  async delete(userId: string, projectId: string, id: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    const task = await this.taskModel
      .findOneAndDelete({ _id: id, projectId })
      .exec();

    this.realtimeGateway.emitToProject(
      projectId,
      RealtimeEvent.TASK_DELETED,
      task,
    );

    return task;
  }
}
