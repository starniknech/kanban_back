import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TokenType } from './common/enums/domain.enums';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ enum: TokenType, default: TokenType.REFRESH })
  type: TokenType;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

