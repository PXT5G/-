import mongoose, { Schema, Document, Types } from 'mongoose';

export type ActiveCallState = 'ringing' | 'connecting' | 'active' | 'on_hold' | 'conference';

export interface IActiveCallParticipant {
  userId?: Types.ObjectId;
  phoneNumber: string;
  displayName: string;
  contactId?: Types.ObjectId;
  isMuted: boolean;
  joinedAt: Date;
}

export interface IActiveCall extends Document {
  callId: Types.ObjectId;
  ownerUserId: Types.ObjectId;
  remoteUserId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  phoneNumber: string;
  remoteNumber: string;
  displayName: string;
  direction: 'incoming' | 'outgoing';
  state: ActiveCallState;
  isEmergency: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
  isOnHold: boolean;
  isConference: boolean;
  conferenceId?: string;
  participants: IActiveCallParticipant[];
  startedAt: Date;
  connectedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IActiveCallParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    phoneNumber: { type: String, required: true },
    displayName: { type: String, required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    isMuted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activeCallSchema = new Schema<IActiveCall>(
  {
    callId: { type: Schema.Types.ObjectId, ref: 'Call', required: true, unique: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    remoteUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phoneNumber: { type: String, required: true },
    remoteNumber: { type: String, required: true },
    displayName: { type: String, required: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    state: { type: String, enum: ['ringing', 'connecting', 'active', 'on_hold', 'conference'], default: 'ringing' },
    isEmergency: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    isSpeaker: { type: Boolean, default: false },
    isOnHold: { type: Boolean, default: false },
    isConference: { type: Boolean, default: false },
    conferenceId: { type: String, index: true },
    participants: { type: [participantSchema], default: [] },
    startedAt: { type: Date, default: Date.now },
    connectedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_active_calls' }
);

activeCallSchema.index({ ownerUserId: 1, state: 1 });

export const ActiveCall = mongoose.model<IActiveCall>('ActiveCall', activeCallSchema);
