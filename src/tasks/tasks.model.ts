import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum StatusEnum {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  POSTPONED = 'POSTPONED',
}

export enum PriorityEnum {
  LOWEST = 'LOWEST',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Number })
  estimatedTime: number;

  @Prop({ type: Number, default: 0 })
  spentTime: number;

  @Prop({ enum: StatusEnum, default: StatusEnum.TODO })
  status: StatusEnum;

  @Prop({ enum: PriorityEnum, default: PriorityEnum.MEDIUM })
  priority: PriorityEnum;

  @Prop({ type: Number, default: 0 })
  completedOn: number;

  @Prop()
  userId?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
