import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISIMSecuritySettings extends Document {
  userId: Types.ObjectId;
  simPinEnabled: boolean;
  simPinHash?: string;
  simLocked: boolean;
  pukCode?: string;
  biometricEnabled: boolean;
  trustedDevices: { deviceId: string; deviceName: string; lastUsedAt: Date }[];
}

const simSecuritySchema = new Schema<ISIMSecuritySettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    simPinEnabled: { type: Boolean, default: false },
    simPinHash: { type: String, select: false },
    simLocked: { type: Boolean, default: false },
    pukCode: { type: String, select: false },
    biometricEnabled: { type: Boolean, default: false },
    trustedDevices: [{
      deviceId: String,
      deviceName: String,
      lastUsedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

export const SIMSecuritySettings = mongoose.model<ISIMSecuritySettings>('SIMSecuritySettings', simSecuritySchema);

export function generatePUK(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}
