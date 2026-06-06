import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.model';
import { Model } from 'mongoose';
import { FileService } from '../file/file.service';
import { UploadedFile } from '../common/types/uploaded-file.type';
import { toObjectId } from '../common/utils/object-id';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly fileService: FileService,
  ) {}

  async create(data: Partial<User>, avatarFile?: UploadedFile) {
    const avatarPath = await this.fileService.saveAvatarFile(avatarFile);
    return this.userModel.create({
      ...data,
      avatar: avatarPath,
    });
  }

  async findAll() {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(toObjectId(id)).select('-passwordHash').exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, data: Partial<User>, avatarFile?: UploadedFile) {
    const userId = toObjectId(id);
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
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
        userId,
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
    return this.userModel.findByIdAndDelete(toObjectId(id)).exec();
  }
}
