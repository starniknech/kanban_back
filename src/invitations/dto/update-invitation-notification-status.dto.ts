import { IsEnum } from 'class-validator';
import { NotificationStatus } from '../../common/enums/domain.enums';

export class UpdateInvitationNotificationStatusDto {
  @IsEnum(NotificationStatus)
  notificationStatus: NotificationStatus;
}
