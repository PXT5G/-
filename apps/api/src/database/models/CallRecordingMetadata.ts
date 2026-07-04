import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICallRecordingMetadata extends Document {
  userId: Types.ObjectId;
  callId: Types.ObjectId;
  durationSeconds: number;
  fileSizeBytes: number;
  format: string;
  storageKey: string;
  consentObtained: boolean;
  startedAt: Date;
  endedAt: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recordingSchema = new Schema<ICallRecordingMetadata>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call', required: true, unique: true },
    durationSeconds: { type: Number, default: 0 },
    fileSizeBytes: { type: Number, default: 0 },
    format: { type: String, default: 'audio/webm' },
    storageKey: { type: String, required: true },
    consentObtained: { type: Boolean, default: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: 'phone_call_recordings' }
);

export const CallRecordingMetadata = mongoose.model<ICallRecordingMetadata>('CallRecordingMetadata', recordingSchema);
