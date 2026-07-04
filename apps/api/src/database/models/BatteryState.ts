import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ChargingType } from '../../constants/deviceEcosystem';
import { auditSchemaFields } from '../baseSchema';

export interface IBatteryState extends Document {
  userId: Types.ObjectId;
  level: number;
  health: number;
  isCharging: boolean;
  chargingType: ChargingType;
  fastChargingEnabled: boolean;
  wirelessChargingEnabled: boolean;
  chargingCycles: number;
  temperatureCelsius: number;
  degradationRate: number;
  estimatedTimeToFullMinutes: number;
  estimatedTimeToEmptyMinutes: number;
  lastChargeAt?: Date;
  lastDischargeAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const batteryStateSchema = new Schema<IBatteryState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    level: { type: Number, default: 100 },
    health: { type: Number, default: 100 },
    isCharging: { type: Boolean, default: false },
    chargingType: { type: String, enum: ['none', 'wired', 'fast', 'wireless'], default: 'none' },
    fastChargingEnabled: { type: Boolean, default: true },
    wirelessChargingEnabled: { type: Boolean, default: true },
    chargingCycles: { type: Number, default: 0 },
    temperatureCelsius: { type: Number, default: 32 },
    degradationRate: { type: Number, default: 0 },
    estimatedTimeToFullMinutes: { type: Number, default: 0 },
    estimatedTimeToEmptyMinutes: { type: Number, default: 480 },
    lastChargeAt: { type: Date },
    lastDischargeAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BatteryState = mongoose.model<IBatteryState>('BatteryState', batteryStateSchema);
