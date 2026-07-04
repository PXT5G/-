import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ConversationRoleType } from '../../constants/communication';

export interface IConversationRole extends Document {
  conversationId: string;
  roleName: ConversationRoleType;
  permissions: string[];
  canSendMessages: boolean;
  canSendMedia: boolean;
  canPinMessages: boolean;
  canDeleteMessages: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationRoleSchema = new Schema<IConversationRole>(
  {
    conversationId: { type: String, required: true, index: true },
    roleName: { type: String, enum: ['owner', 'admin', 'moderator', 'member', 'viewer'], required: true },
    permissions: [{ type: String }],
    canSendMessages: { type: Boolean, default: true },
    canSendMedia: { type: Boolean, default: true },
    canPinMessages: { type: Boolean, default: false },
    canDeleteMessages: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canManageRoles: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

conversationRoleSchema.index({ conversationId: 1, roleName: 1 }, { unique: true });

export const ConversationRole = mongoose.model<IConversationRole>('ConversationRole', conversationRoleSchema);
