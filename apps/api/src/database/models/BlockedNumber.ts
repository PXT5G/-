import mongoose, { Schema, Document, Types } from 'mongoose';

export type BlockType = 'call' | 'sms' | 'both';

export interface IBlockedNumber extends Document {
  userId: Types.ObjectId;
  number: string;
  blockType: BlockType;
  reason?: string;
  createdAt: Date;
}

const blockedNumberSchema = new Schema<IBlockedNumber>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true },
    blockType: { type: String, enum: ['call', 'sms', 'both'], default: 'both' },
    reason: { type: String },
  },
  { timestamps: true }
);

blockedNumberSchema.index({ userId: 1, number: 1 }, { unique: true });

export const BlockedNumber = mongoose.model<IBlockedNumber>('BlockedNumber', blockedNumberSchema);
