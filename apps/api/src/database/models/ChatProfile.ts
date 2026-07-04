import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ChatRole } from '../../constants/chat';

export interface IChatProfile extends Document {
  userId: Types.ObjectId;
  role: ChatRole;
  displayName?: string;
  about?: string;
  avatarUrl?: string;
  biometricLock: boolean;
  initialized: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const chatProfileSchema = new Schema<IChatProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    role: { type: String, default: 'user', index: true },
    displayName: { type: String },
    about: { type: String, default: '' },
    avatarUrl: { type: String },
    biometricLock: { type: Boolean, default: false },
    initialized: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const ChatProfile = mongoose.model<IChatProfile>('ChatProfile', chatProfileSchema);
