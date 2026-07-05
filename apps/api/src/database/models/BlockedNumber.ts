import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IBlockedNumber extends Document {
  blockId: string;
  userId: Types.ObjectId;
  number: string;
  contactId?: string;
  reason?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const blockedNumberSchema = new Schema<IBlockedNumber>(
  {
    blockId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true, index: true },
    contactId: String,
    reason: String,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

blockedNumberSchema.index({ userId: 1, number: 1 });

export const BlockedNumber = mongoose.model<IBlockedNumber>('BlockedNumber', blockedNumberSchema);
