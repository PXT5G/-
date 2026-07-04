import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface INetworkSession extends Document {
  userId: Types.ObjectId;
  towerUuid: string;
  carrier: string;
  generation: string;
  signalBars: number;
  connectionType: string;
  latencyMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  congestion: number;
  vpnActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const networkSessionSchema = new Schema<INetworkSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    towerUuid: { type: String, required: true },
    carrier: { type: String, default: 'GULF Mobile' },
    generation: { type: String, default: '5g' },
    signalBars: { type: Number, default: 0 },
    connectionType: { type: String, default: 'cellular' },
    latencyMs: { type: Number, default: 0 },
    bandwidthMbps: { type: Number, default: 0 },
    packetLoss: { type: Number, default: 0 },
    jitterMs: { type: Number, default: 0 },
    congestion: { type: Number, default: 0 },
    vpnActive: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const NetworkSession = mongoose.model<INetworkSession>('NetworkSession', networkSessionSchema);
