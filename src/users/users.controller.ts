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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { AuthUser } from '../common/auth/auth-user';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadedFile as UploadedFileType } from '../common/types/uploaded-file.type';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('avatar'))
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @UploadedFile() avatar: UploadedFileType,
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('You can update only your own profile');
    }

    return this.usersService.update(id, body, avatar);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    if (user.id !== id) {
      throw new ForbiddenException('You can delete only your own profile');
    }

    return this.usersService.delete(id);
  }
}
