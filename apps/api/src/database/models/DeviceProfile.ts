import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISystemStorageBreakdown {
  operatingSystem: number;
  systemFiles: number;
  logs: number;
  updates: number;
  recovery: number;
  reservedSpace: number;
}

export interface IDeviceProfile extends Document {
  userId: Types.ObjectId;
  deviceName: string;
  totalCapacity: number;
  capacityTier: string;
  systemStorage: ISystemStorageBreakdown;
  osVersion: string;
  buildNumber: string;
  lastStorageRecalc: Date;
  createdAt: Date;
  updatedAt: Date;
}

const systemStorageSchema = new Schema<ISystemStorageBreakdown>(
  {
    operatingSystem: { type: Number, default: 8_500_000_000 },
    systemFiles: { type: Number, default: 2_100_000_000 },
    logs: { type: Number, default: 250_000_000 },
    updates: { type: Number, default: 0 },
    recovery: { type: Number, default: 1_200_000_000 },
    reservedSpace: { type: Number, default: 0 },
  },
  { _id: false }
);

const deviceProfileSchema = new Schema<IDeviceProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    deviceName: { type: String, default: 'Banana Phone' },
    totalCapacity: { type: Number, default: 128_000_000_000 },
    capacityTier: { type: String, default: '128 GB' },
    systemStorage: { type: systemStorageSchema, default: () => ({}) },
    osVersion: { type: String, default: '1.0.0' },
    buildNumber: { type: String, default: '100' },
    lastStorageRecalc: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DeviceProfile = mongoose.model<IDeviceProfile>('DeviceProfile', deviceProfileSchema);
