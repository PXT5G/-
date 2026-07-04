import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVoicemail extends Document {
  userId: Types.ObjectId;
  simProfileId: Types.ObjectId;
  enabled: boolean;
  greeting?: string;
  pin?: string;
  maxMessages: number;
  messageCount: number;
}

const voicemailSchema = new Schema<IVoicemail>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    simProfileId: { type: Schema.Types.ObjectId, ref: 'SIMProfile', required: true },
    enabled: { type: Boolean, default: true },
    greeting: { type: String },
    pin: { type: String, select: false },
    maxMessages: { type: Number, default: 20 },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Voicemail = mongoose.model<IVoicemail>('Voicemail', voicemailSchema);
