import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISystemStorageBreakdown {
  operatingSystem: number;
  systemFiles: number;
  logs: number;
  updates: number;
  recovery: number;
  reservedSpace: number;
  updateReserved?: number;
}

export interface IStorageWear {
  healthPercent: number;
  lifetimeWrites: number;
  lifetimeReads: number;
  estimatedRemainingLifeYears: number;
}

export interface IDeviceProfile extends Document {
  userId: Types.ObjectId;
  deviceName: string;
  deviceModel: string;
  deviceColor: string;
  serialNumber: string;
  deviceUuid: string;
  generation: string;
  cpuModel: string;
  gpuModel: string;
  ramTotalBytes: number;
  totalCapacity: number;
  capacityTier: string;
  batteryCapacityMah: number;
  batteryHealthPercent: number;
  batteryLevelPercent: number;
  displayResolution: string;
  systemStorage: ISystemStorageBreakdown;
  storageWear: IStorageWear;
  osVersion: string;
  buildNumber: string;
  lowStorageMode: boolean;
  emergencyMode: boolean;
  lowStorageLevel: string;
  temperatureCelsius: number;
  bootedAt: Date;
  lastStorageRecalc: Date;
  purchaseDate?: Date;
  warrantyExpiresAt?: Date;
  region: string;
  language: string;
  timezone: string;
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
    updateReserved: { type: Number, default: 0 },
  },
  { _id: false }
);

const storageWearSchema = new Schema<IStorageWear>(
  {
    healthPercent: { type: Number, default: 100 },
    lifetimeWrites: { type: Number, default: 0 },
    lifetimeReads: { type: Number, default: 0 },
    estimatedRemainingLifeYears: { type: Number, default: 8 },
  },
  { _id: false }
);

const deviceProfileSchema = new Schema<IDeviceProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    deviceName: { type: String, default: 'Banana Phone' },
    deviceModel: { type: String, default: 'Banana Phone 15 Pro' },
    deviceColor: { type: String, default: 'Gold' },
    serialNumber: { type: String, default: '' },
    deviceUuid: { type: String, default: '' },
    generation: { type: String, default: 'banana-15-pro' },
    cpuModel: { type: String, default: 'Banana A17 Pro Max' },
    gpuModel: { type: String, default: 'Banana GPU 6-core' },
    ramTotalBytes: { type: Number, default: 8_000_000_000 },
    totalCapacity: { type: Number, default: 128_000_000_000 },
    capacityTier: { type: String, default: '128 GB' },
    batteryCapacityMah: { type: Number, default: 4685 },
    batteryHealthPercent: { type: Number, default: 100 },
    batteryLevelPercent: { type: Number, default: 100 },
    displayResolution: { type: String, default: '2796×1290' },
    systemStorage: { type: systemStorageSchema, default: () => ({}) },
    storageWear: { type: storageWearSchema, default: () => ({}) },
    osVersion: { type: String, default: '1.0.0' },
    buildNumber: { type: String, default: '100' },
    lowStorageMode: { type: Boolean, default: false },
    emergencyMode: { type: Boolean, default: false },
    lowStorageLevel: { type: String, default: 'normal' },
    temperatureCelsius: { type: Number, default: 32 },
    bootedAt: { type: Date, default: Date.now },
    lastStorageRecalc: { type: Date, default: Date.now },
    purchaseDate: { type: Date },
    warrantyExpiresAt: { type: Date },
    region: { type: String, default: 'US' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'America/Los_Angeles' },
  },
  { timestamps: true }
);

export const DeviceProfile = mongoose.model<IDeviceProfile>('DeviceProfile', deviceProfileSchema);
