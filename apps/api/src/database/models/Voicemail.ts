import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVoicemail extends Document {
  voicemailId: string;
  userId: Types.ObjectId;
  fromNumber: string;
  contactName?: string;
  durationSeconds: number;
  transcription?: string;
  audioPath?: string;
  isRead: boolean;
  isPinned: boolean;
  receivedAt: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const voicemailSchema = new Schema<IVoicemail>(
  {
    voicemailId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromNumber: { type: String, required: true },
    contactName: String,
    durationSeconds: { type: Number, default: 0 },
    transcription: String,
    audioPath: String,
    isRead: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },
    receivedAt: { type: Date, default: Date.now, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Voicemail = mongoose.model<IVoicemail>('Voicemail', voicemailSchema);
