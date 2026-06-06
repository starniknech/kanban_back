import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskPriority, TaskStatus } from '../common/enums/domain.enums';
import { UserProject } from '../user-projects/user-projects.model';

@Schema({ collection: 'tasks', timestamps: true })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Prop({ type: Number, default: 0 })
  position: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdByUserId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: UserProject.name }],
    default: [],
  })
  assignees: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
