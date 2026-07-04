import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatRole, ChatPermission } from '../../constants/chat';

export interface IChatRoleConfig extends Document {
  role: ChatRole;
  permissions: ChatPermission[];
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatRoleConfigSchema = new Schema<IChatRoleConfig>(
  {
    role: { type: String, required: true, unique: true, index: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ChatRoleConfig = mongoose.model<IChatRoleConfig>('ChatRoleConfig', chatRoleConfigSchema);
