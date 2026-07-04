import mongoose, { Schema, Document, Types } from 'mongoose';

export type CallDirection = 'incoming' | 'outgoing';
export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'on_hold'
  | 'ended'
  | 'missed'
  | 'rejected'
  | 'failed'
  | 'voicemail';

export interface ICall extends Document {
  userId: Types.ObjectId;
  remoteUserId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  phoneNumber: string;
  remoteNumber: string;
  direction: CallDirection;
  status: CallStatus;
  isEmergency: boolean;
  isConference: boolean;
  conferenceId?: string;
  startedAt?: Date;
  connectedAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isOnHold: boolean;
  recordingId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    remoteUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phoneNumber: { type: String, required: true, index: true },
    remoteNumber: { type: String, required: true, index: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'connecting', 'active', 'on_hold', 'ended', 'missed', 'rejected', 'failed', 'voicemail'],
      default: 'initiated',
      index: true,
    },
    isEmergency: { type: Boolean, default: false },
    isConference: { type: Boolean, default: false },
    conferenceId: { type: String, index: true },
    startedAt: { type: Date },
    connectedAt: { type: Date },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    isMuted: { type: Boolean, default: false },
    isSpeaker: { type: Boolean, default: false },
    isOnHold: { type: Boolean, default: false },
    recordingId: { type: Schema.Types.ObjectId, ref: 'CallRecordingMetadata' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: 'phone_calls' }
);

callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ userId: 1, status: 1 });

export const Call = mongoose.model<ICall>('Call', callSchema);
