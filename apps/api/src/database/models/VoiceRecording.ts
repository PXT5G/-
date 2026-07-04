import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVoiceRecording extends Document {
  userId: Types.ObjectId;
  recordingId: string;
  name: string;
  durationSeconds: number;
  sizeBytes: number;
  noiseReduction: boolean;
  bookmarks: Array<{ seconds: number; label: string }>;
  trimStart?: number;
  trimEnd?: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const voiceRecordingSchema = new Schema<IVoiceRecording>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recordingId: { type: String, required: true },
    name: { type: String, required: true },
    durationSeconds: { type: Number, required: true },
    sizeBytes: { type: Number, default: 0 },
    noiseReduction: { type: Boolean, default: true },
    bookmarks: [{
      seconds: Number,
      label: String,
    }],
    trimStart: { type: Number },
    trimEnd: { type: Number },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

voiceRecordingSchema.index({ userId: 1, recordingId: 1 }, { unique: true });

export const VoiceRecording = mongoose.model<IVoiceRecording>('VoiceRecording', voiceRecordingSchema);
