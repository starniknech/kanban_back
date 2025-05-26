import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.model';
import { Model, Types } from 'mongoose';
import { FileService } from '../file/file.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly fileService: FileService,
  ) {}

  async create(data: Partial<User>, avatarFile?: Express.Multer.File) {
    const avatarPath = await this.fileService.saveAvatarFile(avatarFile);
    return this.userModel.create({
      ...data,
      avatar: avatarPath,
      tasks: [],
    });
  }

  async findAll() {
    return this.userModel.find().populate('tasks').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).populate('tasks').exec();
  }

  async update(id: string, data: Partial<User>, avatarFile?: Express.Multer.File) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    let updatedAvatarPath = user.avatar;

    if (avatarFile) {
      updatedAvatarPath = await this.fileService.saveAvatarFile(avatarFile);

      if (user.avatar && user.avatar !== this.fileService['defaultAvatar']) {
        await this.fileService.deleteFile(user.avatar);
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          ...data,
          avatar: updatedAvatarPath,
        },
        { new: true },
      )
      .exec();

    return updatedUser;
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async assignTask(userId: string, taskId: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { tasks: new Types.ObjectId(taskId) } }, { new: true })
      .exec();
  }
}
