import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ITypingStatus extends Document {
  conversationId: string;
  userId: Types.ObjectId;
  isTyping: boolean;
  isRecording: boolean;
  expiresAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const typingStatusSchema = new Schema<ITypingStatus>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isTyping: { type: Boolean, default: true },
    isRecording: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

typingStatusSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const TypingStatus = mongoose.model<ITypingStatus>('TypingStatus', typingStatusSchema);
