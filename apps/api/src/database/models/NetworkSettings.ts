import mongoose, { Schema, Document, Types } from 'mongoose';

export type NetworkMode = '4G' | '5G' | 'LTE' | 'auto';
export type SignalStrength = 'none' | 'poor' | 'fair' | 'good' | 'excellent';

export interface INetworkSettings extends Document {
  userId: Types.ObjectId;
  simProfileId: Types.ObjectId;
  carrierId: Types.ObjectId;
  networkMode: NetworkMode;
  wifiCalling: boolean;
  roaming: boolean;
  internetStatus: boolean;
  signalStrength: SignalStrength;
  signalBars: number;
  coverage: string;
  lastDiagnosticAt?: Date;
}

const networkSettingsSchema = new Schema<INetworkSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    simProfileId: { type: Schema.Types.ObjectId, ref: 'SIMProfile', required: true },
    carrierId: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
    networkMode: { type: String, enum: ['4G', '5G', 'LTE', 'auto'], default: '5G' },
    wifiCalling: { type: Boolean, default: true },
    roaming: { type: Boolean, default: false },
    internetStatus: { type: Boolean, default: true },
    signalStrength: { type: String, enum: ['none', 'poor', 'fair', 'good', 'excellent'], default: 'excellent' },
    signalBars: { type: Number, default: 5, min: 0, max: 5 },
    coverage: { type: String, default: 'National' },
    lastDiagnosticAt: { type: Date },
  },
  { timestamps: true }
);

export const NetworkSettings = mongoose.model<INetworkSettings>('NetworkSettings', networkSettingsSchema);
