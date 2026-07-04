import mongoose, { Schema, Document } from 'mongoose';

export interface IChatChannel extends Document {
  channelId: string;
  conversationId: string;
  isPublic: boolean;
  subscriberCount: number;
  description: string;
  inviteCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatChannelSchema = new Schema<IChatChannel>(
  {
    channelId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, unique: true, index: true },
    isPublic: { type: Boolean, default: true, index: true },
    subscriberCount: { type: Number, default: 0 },
    description: { type: String, default: '' },
    inviteCode: { type: String, index: true },
  },
  { timestamps: true }
);

export const ChatChannel = mongoose.model<IChatChannel>('ChatChannel', chatChannelSchema);
