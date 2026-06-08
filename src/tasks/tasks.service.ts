import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './tasks.model';
import { Model } from 'mongoose';
import { ProjectRole, TaskStatus } from '../common/enums/domain.enums';
import { toObjectId, toObjectIds } from '../common/utils/object-id';
import { RealtimeTasksGateway } from '../realtime/tasks.gateway';
import { UserProjectsService } from '../user-projects/user-projects.service';

type TaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Task['priority'];
  position?: number;
  assignees?: string[];
  dueDate?: string | Date;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    private readonly userProjectsService: UserProjectsService,
    @Inject(forwardRef(() => RealtimeTasksGateway))
    private readonly realtimeTasksGateway: RealtimeTasksGateway,
  ) {}

  async create(userId: string, projectId: string, data: TaskInput) {
    await this.userProjectsService.requireMember(userId, projectId);

    const task = await this.taskModel.create({
      ...data,
      projectId: toObjectId(projectId),
      createdByUserId: toObjectId(userId),
      assignees: toObjectIds(data.assignees),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    await this.populateAssignees(task);

    this.realtimeTasksGateway.emitCreated(projectId, task);

    return task;
  }

  async findAll(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.taskModel
      .find({ projectId: toObjectId(projectId) })
      .sort({ position: 1 })
      .populate(this.assigneePopulateOptions())
      .exec();
  }

  async findById(userId: string, projectId: string, id: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.taskModel
      .findOne({
        _id: toObjectId(id),
        projectId: toObjectId(projectId),
      })
      .populate(this.assigneePopulateOptions())
      .exec();
  }

  async update(userId: string, projectId: string, id: string, data: TaskInput) {
    await this.userProjectsService.requireMember(userId, projectId);
    const updateData = {
      ...data,
      assignees: data.assignees ? toObjectIds(data.assignees) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };

    const task = await this.taskModel
      .findOneAndUpdate(
        {
          _id: toObjectId(id),
          projectId: toObjectId(projectId),
        },
        updateData,
        { new: true },
      )
      .populate(this.assigneePopulateOptions())
      .exec();

    this.realtimeTasksGateway.emitUpdated(projectId, task);

    return task;
  }

  async move(userId: string, projectId: string, id: string, data: { status?: TaskStatus; position?: number }) {
    await this.userProjectsService.requireMember(userId, projectId);

    const task = await this.taskModel
      .findOneAndUpdate(
        {
          _id: toObjectId(id),
          projectId: toObjectId(projectId),
        },
        data,
        { new: true },
      )
      .populate(this.assigneePopulateOptions())
      .exec();

    this.realtimeTasksGateway.emitMoved(projectId, task);

    return task;
  }

  async delete(userId: string, projectId: string, id: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    const task = await this.taskModel
      .findOneAndDelete({
        _id: toObjectId(id),
        projectId: toObjectId(projectId),
      })
      .populate(this.assigneePopulateOptions())
      .exec();

    this.realtimeTasksGateway.emitDeleted(projectId, task);

    return task;
  }

  private assigneePopulateOptions() {
    return {
      path: 'assignees',
      populate: {
        path: 'userId',
        select: 'name email avatar',
      },
    };
  }

  private populateAssignees(task: Task) {
    return task.populate(this.assigneePopulateOptions());
  }
}
