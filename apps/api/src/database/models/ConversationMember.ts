import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ConversationRoleType } from '../../constants/communication';

export interface IConversationMember extends Document {
  conversationId: string;
  userId: Types.ObjectId;
  role: ConversationRoleType;
  nickname?: string;
  muted: boolean;
  pinned: boolean;
  joinedAt: Date;
  leftAt?: Date;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  notificationLevel: 'all' | 'mentions' | 'none';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationMemberSchema = new Schema<IConversationMember>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'admin', 'moderator', 'member', 'viewer'], default: 'member' },
    nickname: { type: String },
    muted: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    lastReadMessageId: { type: String },
    lastReadAt: { type: Date },
    notificationLevel: { type: String, enum: ['all', 'mentions', 'none'], default: 'all' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

conversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
conversationMemberSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

export const ConversationMember = mongoose.model<IConversationMember>('ConversationMember', conversationMemberSchema);
