import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { ChargingType, PowerMode } from '../../constants/deviceEcosystem';

export interface IDevicePowerState extends Document {
  userId: Types.ObjectId;
  batteryLevel: number;
  batteryHealth: number;
  chargingCycles: number;
  chargingType: ChargingType;
  isCharging: boolean;
  fastChargingEnabled: boolean;
  wirelessChargingEnabled: boolean;
  powerMode: PowerMode;
  degradationRate: number;
  lastChargeAt?: Date;
  emergencyShutdownAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const devicePowerStateSchema = new Schema<IDevicePowerState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    batteryLevel: { type: Number, default: 100 },
    batteryHealth: { type: Number, default: 100 },
    chargingCycles: { type: Number, default: 0 },
    chargingType: { type: String, enum: ['none', 'wired', 'fast', 'wireless'], default: 'none' },
    isCharging: { type: Boolean, default: false },
    fastChargingEnabled: { type: Boolean, default: true },
    wirelessChargingEnabled: { type: Boolean, default: true },
    powerMode: { type: String, enum: ['normal', 'low_power', 'critical', 'emergency_shutdown'], default: 'normal' },
    degradationRate: { type: Number, default: 0.002 },
    lastChargeAt: { type: Date },
    emergencyShutdownAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DevicePowerState = mongoose.model<IDevicePowerState>('DevicePowerState', devicePowerStateSchema);
