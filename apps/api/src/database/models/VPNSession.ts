import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVPNSession extends Document {
  userId: Types.ObjectId;
  country: string;
  countryName: string;
  virtualIp: string;
  encryption: string;
  latencyPenaltyMs: number;
  bandwidthPenaltyMbps: number;
  active: boolean;
  connectedAt: Date;
  disconnectedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const vpnSessionSchema = new Schema<IVPNSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    country: { type: String, required: true },
    countryName: { type: String, default: '' },
    virtualIp: { type: String, required: true },
    encryption: { type: String, default: 'AES-256-GCM' },
    latencyPenaltyMs: { type: Number, default: 25 },
    bandwidthPenaltyMbps: { type: Number, default: 15 },
    active: { type: Boolean, default: true, index: true },
    connectedAt: { type: Date, default: Date.now },
    disconnectedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const VPNSession = mongoose.model<IVPNSession>('VPNSession', vpnSessionSchema);
