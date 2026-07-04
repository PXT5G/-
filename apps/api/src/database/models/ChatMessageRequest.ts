import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatMessageRequestStatus } from '../../constants/chat';

export interface IChatMessageRequest extends Document {
  requestId: string;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  message: string;
  status: ChatMessageRequestStatus;
  conversationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatMessageRequestSchema = new Schema<IChatMessageRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    status: { type: String, default: 'pending', index: true },
    conversationId: { type: String },
  },
  { timestamps: true }
);

export const ChatMessageRequest = mongoose.model<IChatMessageRequest>('ChatMessageRequest', chatMessageRequestSchema);
