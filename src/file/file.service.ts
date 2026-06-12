import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile } from '../common/types/uploaded-file.type';

@Injectable()
export class FileService {
  private readonly uploadRoot = path.join(process.cwd(), 'uploads');
  private readonly uploadDir = path.join(this.uploadRoot, 'avatars');
  private readonly defaultAvatar = '/uploads/avatars/default-ava.webp';

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveAvatarFile(avatarFile?: UploadedFile): Promise<string> {
    if (!avatarFile) {
      return this.defaultAvatar;
    }

    const fileExtension = path.extname(avatarFile.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);
    const avatarPath = `/uploads/avatars/${fileName}`;

    await fs.promises.writeFile(filePath, avatarFile.buffer);

    return avatarPath;
  }

  async deleteFile(avatarPath: string): Promise<void> {
    const relativePath = avatarPath.replace(/^\/uploads\/?/, '');
    const fullPath = path.resolve(this.uploadRoot, relativePath);

    if (!fullPath.startsWith(this.uploadRoot)) {
      return;
    }

    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }
}
