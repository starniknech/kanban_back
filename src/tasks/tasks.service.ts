import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './tasks.model';
import { Model } from 'mongoose';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async create(data: Partial<Task>) {
    return this.taskModel.create(data);
  }

  async findAll() {
    return this.taskModel.find().exec();
  }

  async findById(id: string) {
    return this.taskModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Task>) {
    return this.taskModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    return this.taskModel.findByIdAndDelete(id).exec();
  }
}
