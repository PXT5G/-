import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IReadReceipt extends Document {
  messageId: string;
  conversationId: string;
  userId: Types.ObjectId;
  readAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const readReceiptSchema = new Schema<IReadReceipt>(
  {
    messageId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

readReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
readReceiptSchema.index({ conversationId: 1, userId: 1, readAt: -1 });

export const ReadReceipt = mongoose.model<IReadReceipt>('ReadReceipt', readReceiptSchema);
