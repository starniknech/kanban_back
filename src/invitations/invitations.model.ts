import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InvitationRole, InvitationStatus, NotificationStatus } from '../common/enums/domain.enums';

@Schema({ timestamps: true })
export class Invitation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedByUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  invitedUserId?: Types.ObjectId | null;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ enum: InvitationRole, default: InvitationRole.MEMBER })
  role: InvitationRole;

  @Prop({ enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.UNREAD })
  notificationStatus: NotificationStatus;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  acceptedAt?: Date | null;

  @Prop({ type: Date, default: null })
  declinedAt?: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt?: Date | null;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
