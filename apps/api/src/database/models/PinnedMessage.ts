import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPinnedMessage extends Document {
  conversationId: string;
  messageId: string;
  pinnedBy: Types.ObjectId;
  pinnedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const pinnedMessageSchema = new Schema<IPinnedMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    messageId: { type: String, required: true, index: true },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pinnedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

pinnedMessageSchema.index({ conversationId: 1, messageId: 1 }, { unique: true });

export const PinnedMessage = mongoose.model<IPinnedMessage>('PinnedMessage', pinnedMessageSchema);
