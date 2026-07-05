import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ConversationType } from '../../constants/communication';

export interface IConversation extends Document {
  conversationId: string;
  type: ConversationType;
  title?: string;
  description?: string;
  avatarUrl?: string;
  organizationId?: string;
  isEncrypted: boolean;
  announcementOnly: boolean;
  pinnedMessageIds: string[];
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  memberCount: number;
  metadata: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['private', 'group', 'organization', 'government', 'police', 'justice', 'emergency', 'bank', 'business', 'announcement'],
      required: true,
      index: true,
    },
    title: { type: String },
    description: { type: String },
    avatarUrl: { type: String },
    organizationId: { type: String, index: true },
    isEncrypted: { type: Boolean, default: true },
    announcementOnly: { type: Boolean, default: false },
    pinnedMessageIds: [{ type: String }],
    lastMessageAt: { type: Date, index: true },
    lastMessagePreview: { type: String },
    memberCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

conversationSchema.index({ type: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
