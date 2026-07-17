import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CallDirection, CallStatus, CallType, AudioRoute } from '../../constants/telephony';
import { auditSchemaFields } from '../baseSchema';

export interface IPhoneCall extends Document {
  callId: string;
  userId: Types.ObjectId;
  phoneId?: string;
  characterRecordId?: string;
  direction: CallDirection;
  status: CallStatus;
  callType: CallType;
  fromNumber: string;
  toNumber: string;
  contactId?: string;
  contactName?: string;
  durationSeconds: number;
  isHdVoice: boolean;
  isSpam: boolean;
  isBlocked: boolean;
  isEmergency: boolean;
  isConference: boolean;
  conferenceId?: string;
  recordingEnabled: boolean;
  recordingPath?: string;
  notes?: string;
  tags: string[];
  audioRoute: AudioRoute;
  muted: boolean;
  onHold: boolean;
  signalStrength: number;
  simSlot?: string;
  startedAt?: Date;
  connectedAt?: Date;
  endedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const phoneCallSchema = new Schema<IPhoneCall>(
  {
    callId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneId: { type: String, index: true },
    characterRecordId: { type: String, index: true },
    direction: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    callType: { type: String, required: true, default: 'voice' },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true, index: true },
    contactId: String,
    contactName: String,
    durationSeconds: { type: Number, default: 0 },
    isHdVoice: { type: Boolean, default: true },
    isSpam: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isEmergency: { type: Boolean, default: false },
    isConference: { type: Boolean, default: false },
    conferenceId: String,
    recordingEnabled: { type: Boolean, default: false },
    recordingPath: String,
    notes: String,
    tags: { type: [String], default: [] },
    audioRoute: { type: String, default: 'earpiece' },
    muted: { type: Boolean, default: false },
    onHold: { type: Boolean, default: false },
    signalStrength: { type: Number, default: 5 },
    simSlot: String,
    startedAt: Date,
    connectedAt: Date,
    endedAt: Date,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

phoneCallSchema.index({ userId: 1, createdAt: -1 });
phoneCallSchema.index({ userId: 1, status: 1 });

export const PhoneCall = mongoose.model<IPhoneCall>('PhoneCall', phoneCallSchema);
