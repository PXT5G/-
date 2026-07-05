import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatPrivacyLevel } from '../../constants/chat';

export interface IChatPrivacySettings extends Document {
  userId: Types.ObjectId;
  lastSeen: ChatPrivacyLevel;
  onlineStatus: ChatPrivacyLevel;
  typingIndicator: ChatPrivacyLevel;
  readReceipts: boolean;
  profileVisibility: ChatPrivacyLevel;
  groupInvites: ChatPrivacyLevel;
  callPrivacy: ChatPrivacyLevel;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatPrivacySettingsSchema = new Schema<IChatPrivacySettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    lastSeen: { type: String, default: 'contacts' },
    onlineStatus: { type: String, default: 'contacts' },
    typingIndicator: { type: String, default: 'contacts' },
    readReceipts: { type: Boolean, default: true },
    profileVisibility: { type: String, default: 'everyone' },
    groupInvites: { type: String, default: 'contacts' },
    callPrivacy: { type: String, default: 'contacts' },
  },
  { timestamps: true }
);

export const ChatPrivacySettings = mongoose.model<IChatPrivacySettings>('ChatPrivacySettings', chatPrivacySettingsSchema);
