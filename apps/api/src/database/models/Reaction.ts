import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IReaction extends Document {
  messageId: string;
  conversationId: string;
  userId: Types.ObjectId;
  emoji: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    messageId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

reactionSchema.index({ messageId: 1, userId: 1, emoji: 1 }, { unique: true });

export const Reaction = mongoose.model<IReaction>('Reaction', reactionSchema);
