import { Types } from 'mongoose';

export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return id instanceof Types.ObjectId ? id : new Types.ObjectId(id);
}

export function toObjectIds(ids: Array<string | Types.ObjectId> | undefined): Types.ObjectId[] {
  return ids?.map((id) => toObjectId(id)) ?? [];
}
