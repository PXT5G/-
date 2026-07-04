import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IChatCommunity extends Document {
  communityId: string;
  conversationId: string;
  name: string;
  description: string;
  channelIds: string[];
  groupIds: string[];
  ownerId: Types.ObjectId;
  memberCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const chatCommunitySchema = new Schema<IChatCommunity>(
  {
    communityId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    channelIds: [{ type: String }],
    groupIds: [{ type: String }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberCount: { type: Number, default: 1 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const ChatCommunity = mongoose.model<IChatCommunity>('ChatCommunity', chatCommunitySchema);
