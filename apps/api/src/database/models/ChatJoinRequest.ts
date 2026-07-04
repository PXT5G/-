import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatJoinRequestStatus } from '../../constants/chat';

export interface IChatJoinRequest extends Document {
  requestId: string;
  conversationId: string;
  userId: Types.ObjectId;
  message?: string;
  status: ChatJoinRequestStatus;
  reviewedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatJoinRequestSchema = new Schema<IChatJoinRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String },
    status: { type: String, default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ChatJoinRequest = mongoose.model<IChatJoinRequest>('ChatJoinRequest', chatJoinRequestSchema);
