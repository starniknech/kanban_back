import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MEMBER_ROLES } from '../common/auth/role-utils';
import { ProjectRole } from '../common/enums/domain.enums';

@Schema({ collection: 'user-projects', timestamps: true })
export class UserProject extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: [String], enum: ProjectRole, default: MEMBER_ROLES })
  role: ProjectRole[];

  @Prop({ default: Date.now })
  joinedAt: Date;
}

export const UserProjectSchema = SchemaFactory.createForClass(UserProject);
UserProjectSchema.index({ userId: 1, projectId: 1 }, { unique: true });
