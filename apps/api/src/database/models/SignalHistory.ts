import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ISignalHistory extends Document {
  userId: Types.ObjectId;
  towerUuid: string;
  signalBars: number;
  signalDbm: number;
  generation: string;
  latencyMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  congestion: number;
  latitude: number;
  longitude: number;
  recordedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const signalHistorySchema = new Schema<ISignalHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    towerUuid: { type: String, required: true },
    signalBars: { type: Number, default: 0 },
    signalDbm: { type: Number, default: -80 },
    generation: { type: String, default: '5g' },
    latencyMs: { type: Number, default: 0 },
    bandwidthMbps: { type: Number, default: 0 },
    packetLoss: { type: Number, default: 0 },
    jitterMs: { type: Number, default: 0 },
    congestion: { type: Number, default: 0 },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

signalHistorySchema.index({ userId: 1, recordedAt: -1 });

export const SignalHistory = mongoose.model<ISignalHistory>('SignalHistory', signalHistorySchema);
