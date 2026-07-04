import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { UnlockMethodType } from '../../constants/deviceEcosystem';

export interface ITrustedDevice {
  deviceId: string;
  deviceName: string;
  lastSeenAt: Date;
  trustedAt: Date;
}

export interface IDeviceSecurityConfig extends Document {
  userId: Types.ObjectId;
  faceUnlockEnabled: boolean;
  fingerprintEnabled: boolean;
  pinEnabled: boolean;
  passwordEnabled: boolean;
  primaryUnlockMethod: UnlockMethodType;
  trustedDevices: ITrustedDevice[];
  failedAttempts: number;
  tempLockedUntil?: Date;
  remoteLocked: boolean;
  remoteWipeRequested: boolean;
  remoteWipeCompletedAt?: Date;
  lastUnlockAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const trustedDeviceSchema = new Schema<ITrustedDevice>(
  {
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    lastSeenAt: { type: Date, default: Date.now },
    trustedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deviceSecurityConfigSchema = new Schema<IDeviceSecurityConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    faceUnlockEnabled: { type: Boolean, default: false },
    fingerprintEnabled: { type: Boolean, default: false },
    pinEnabled: { type: Boolean, default: false },
    passwordEnabled: { type: Boolean, default: false },
    primaryUnlockMethod: { type: String, enum: ['face', 'fingerprint', 'pin', 'password', 'none'], default: 'pin' },
    trustedDevices: [trustedDeviceSchema],
    failedAttempts: { type: Number, default: 0 },
    tempLockedUntil: { type: Date },
    remoteLocked: { type: Boolean, default: false },
    remoteWipeRequested: { type: Boolean, default: false },
    remoteWipeCompletedAt: { type: Date },
    lastUnlockAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DeviceSecurityConfig = mongoose.model<IDeviceSecurityConfig>(
  'DeviceSecurityConfig',
  deviceSecurityConfigSchema
);
