import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatConversationKind } from '../../constants/chat';

export interface IChatConversationMeta extends Document {
  metaId: string;
  userId: Types.ObjectId;
  conversationId: string;
  kind: ChatConversationKind;
  archived: boolean;
  favorite: boolean;
  hidden: boolean;
  locked: boolean;
  priority: boolean;
  unreadOnly: boolean;
  draft?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatConversationMetaSchema = new Schema<IChatConversationMeta>(
  {
    metaId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    kind: { type: String, default: 'private', index: true },
    archived: { type: Boolean, default: false, index: true },
    favorite: { type: Boolean, default: false, index: true },
    hidden: { type: Boolean, default: false, index: true },
    locked: { type: Boolean, default: false },
    priority: { type: Boolean, default: false, index: true },
    unreadOnly: { type: Boolean, default: false },
    draft: { type: String },
  },
  { timestamps: true }
);

chatConversationMetaSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

export const ChatConversationMeta = mongoose.model<IChatConversationMeta>('ChatConversationMeta', chatConversationMetaSchema);
