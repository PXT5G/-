import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryModerationLog extends Document {
  logId: string;
  poemId: string;
  actorId: Types.ObjectId;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  createdAt: Date;
}

const poetryModerationLogSchema = new Schema<IPoetryModerationLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    poemId: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    deviceUuid: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PoetryModerationLog = mongoose.model<IPoetryModerationLog>('PoetryModerationLog', poetryModerationLogSchema);
