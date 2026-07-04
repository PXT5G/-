import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneVoicemail extends Document {
  userId: Types.ObjectId;
  callId?: Types.ObjectId;
  fromNumber: string;
  fromName: string;
  contactId?: Types.ObjectId;
  durationSeconds: number;
  transcript?: string;
  isRead: boolean;
  isUrgent: boolean;
  audioUrl?: string;
  receivedAt: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneVoicemailSchema = new Schema<IPhoneVoicemail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call' },
    fromNumber: { type: String, required: true },
    fromName: { type: String, required: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    durationSeconds: { type: Number, default: 0 },
    transcript: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    isUrgent: { type: Boolean, default: false },
    audioUrl: { type: String },
    receivedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: 'phone_voicemails' }
);

phoneVoicemailSchema.index({ userId: 1, receivedAt: -1 });

export const PhoneVoicemail = mongoose.model<IPhoneVoicemail>('PhoneVoicemail', phoneVoicemailSchema);
