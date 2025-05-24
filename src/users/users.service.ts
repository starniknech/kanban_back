import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.model';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  async findAll() {
    return this.userModel.find().populate('tasks').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('tasks').exec();
  }

  async update(id: string, data: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async assignTask(userId: string, taskId: string) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { tasks: new Types.ObjectId(taskId) } },
        { new: true },
      )
      .exec();
  }
}
