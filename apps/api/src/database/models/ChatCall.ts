import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChatCallType, ChatCallStatus } from '../../constants/chat';

export interface IChatCall extends Document {
  callId: string;
  conversationId: string;
  initiatorId: Types.ObjectId;
  callType: ChatCallType;
  status: ChatCallStatus;
  recordingEnabled: boolean;
  recordingPath?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatCallSchema = new Schema<IChatCall>(
  {
    callId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    initiatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callType: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    recordingEnabled: { type: Boolean, default: false },
    recordingPath: { type: String },
    startedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ChatCall = mongoose.model<IChatCall>('ChatCall', chatCallSchema);
