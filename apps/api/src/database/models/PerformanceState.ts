import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PerformanceMode, ThermalState } from '../../constants/phoneOs';
import { auditSchemaFields } from '../baseSchema';

export interface IBackgroundApp {
  bundleId: string;
  memoryMb: number;
  cpuPercent: number;
  frozen: boolean;
  pinned: boolean;
  locked: boolean;
  lastActiveAt: Date;
}

export interface IPerformanceState extends Document {
  userId: Types.ObjectId;
  performanceMode: PerformanceMode;
  thermalState: ThermalState;
  cpuUsagePercent: number;
  gpuUsagePercent: number;
  memoryPressure: number;
  backgroundApps: IBackgroundApp[];
  cpuThrottled: boolean;
  gpuThrottled: boolean;
  batteryOptimized: boolean;
  lastTickAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const backgroundAppSchema = new Schema<IBackgroundApp>(
  {
    bundleId: { type: String, required: true },
    memoryMb: { type: Number, default: 0 },
    cpuPercent: { type: Number, default: 0 },
    frozen: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const performanceStateSchema = new Schema<IPerformanceState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    performanceMode: {
      type: String,
      enum: ['normal', 'balanced', 'performance', 'power_saving', 'ultra_power_saving'],
      default: 'normal',
    },
    thermalState: {
      type: String,
      enum: ['nominal', 'fair', 'serious', 'critical'],
      default: 'nominal',
    },
    cpuUsagePercent: { type: Number, default: 15 },
    gpuUsagePercent: { type: Number, default: 10 },
    memoryPressure: { type: Number, default: 0 },
    backgroundApps: { type: [backgroundAppSchema], default: [] },
    cpuThrottled: { type: Boolean, default: false },
    gpuThrottled: { type: Boolean, default: false },
    batteryOptimized: { type: Boolean, default: false },
    lastTickAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PerformanceState = mongoose.model<IPerformanceState>('PerformanceState', performanceStateSchema);
