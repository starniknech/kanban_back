import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { ProjectRole } from '../../common/enums/domain.enums';

export class UpdateMemberRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ProjectRole, { each: true })
  role: ProjectRole[];
}

