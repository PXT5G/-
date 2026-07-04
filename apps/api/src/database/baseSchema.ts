import { Schema, Types } from 'mongoose';

export interface IAuditFields {
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

export const auditSchemaFields = {
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null, index: true },
};

export function softDeleteFilter() {
  return { deletedAt: null };
}
