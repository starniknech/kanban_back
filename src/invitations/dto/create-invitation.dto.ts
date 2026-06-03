import { IsEmail, IsEnum } from 'class-validator';
import { InvitationRole } from '../../common/enums/domain.enums';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(InvitationRole)
  role: InvitationRole;
}

