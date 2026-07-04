import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'limited';

export interface INetworkState extends Document {
  userId: Types.ObjectId;
  carrier: string;
  signalStrength: number;
  cellTowers: { id: string; strength: number; band: string }[];
  internetConnected: boolean;
  vpnEnabled: boolean;
  vpnName?: string;
  coverage: string;
  latencyMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  connectionState: ConnectionState;
  wifiEnabled: boolean;
  wifiSsid?: string;
  bluetoothEnabled: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const networkStateSchema = new Schema<INetworkState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    carrier: { type: String, default: 'Banana Mobile' },
    signalStrength: { type: Number, default: 4, min: 0, max: 5 },
    cellTowers: [
      {
        id: String,
        strength: Number,
        band: String,
      },
    ],
    internetConnected: { type: Boolean, default: true },
    vpnEnabled: { type: Boolean, default: false },
    vpnName: { type: String },
    coverage: { type: String, default: '5G' },
    latencyMs: { type: Number, default: 28 },
    bandwidthMbps: { type: Number, default: 150 },
    packetLoss: { type: Number, default: 0.1 },
    jitterMs: { type: Number, default: 2 },
    connectionState: {
      type: String,
      enum: ['connected', 'connecting', 'disconnected', 'limited'],
      default: 'connected',
    },
    wifiEnabled: { type: Boolean, default: true },
    wifiSsid: { type: String, default: 'BananaOS-5G' },
    bluetoothEnabled: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const NetworkState = mongoose.model<INetworkState>('NetworkState', networkStateSchema);
