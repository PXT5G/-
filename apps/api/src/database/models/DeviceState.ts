import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type ScreenState = 'on' | 'off' | 'dimmed';
export type LockState = 'locked' | 'unlocked';

export interface IDeviceState extends Document {
  userId: Types.ObjectId;
  batteryLevel: number;
  batteryHealth: number;
  isCharging: boolean;
  temperature: number;
  screenState: ScreenState;
  lockState: LockState;
  ramUsed: number;
  ramTotal: number;
  storageUsed: number;
  storageTotal: number;
  cpuLoad: number;
  gpuLoad: number;
  deviceHealth: number;
  lowPowerMode: boolean;
  criticalMode: boolean;
  emergencyMode: boolean;
  lastSnapshotAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deviceStateSchema = new Schema<IDeviceState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    batteryLevel: { type: Number, default: 100 },
    batteryHealth: { type: Number, default: 100 },
    isCharging: { type: Boolean, default: false },
    temperature: { type: Number, default: 32 },
    screenState: { type: String, enum: ['on', 'off', 'dimmed'], default: 'on' },
    lockState: { type: String, enum: ['locked', 'unlocked'], default: 'unlocked' },
    ramUsed: { type: Number, default: 0 },
    ramTotal: { type: Number, default: 8_000_000_000 },
    storageUsed: { type: Number, default: 0 },
    storageTotal: { type: Number, default: 128_000_000_000 },
    cpuLoad: { type: Number, default: 0.15 },
    gpuLoad: { type: Number, default: 0.1 },
    deviceHealth: { type: Number, default: 100 },
    lowPowerMode: { type: Boolean, default: false },
    criticalMode: { type: Boolean, default: false },
    emergencyMode: { type: Boolean, default: false },
    lastSnapshotAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DeviceState = mongoose.model<IDeviceState>('DeviceState', deviceStateSchema);
