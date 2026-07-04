import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CallDirection, CallStatus } from './Call';

export interface ICallHistory extends Document {
  userId: Types.ObjectId;
  callId: Types.ObjectId;
  remoteUserId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  displayName: string;
  phoneNumber: string;
  remoteNumber: string;
  direction: CallDirection;
  status: CallStatus;
  isEmergency: boolean;
  isConference: boolean;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const callHistorySchema = new Schema<ICallHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call', required: true },
    remoteUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    displayName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    remoteNumber: { type: String, required: true, index: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'connecting', 'active', 'on_hold', 'ended', 'missed', 'rejected', 'failed', 'voicemail'],
      required: true,
      index: true,
    },
    isEmergency: { type: Boolean, default: false },
    isConference: { type: Boolean, default: false },
    durationSeconds: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_call_histories' }
);

callHistorySchema.index({ userId: 1, endedAt: -1 });
callHistorySchema.index({ userId: 1, direction: 1, status: 1 });

export const CallHistory = mongoose.model<ICallHistory>('CallHistory', callHistorySchema);
