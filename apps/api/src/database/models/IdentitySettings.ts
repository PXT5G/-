import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdentitySettings extends Document {
  userId: Types.ObjectId;
  identityId: Types.ObjectId;
  pinEnabled: boolean;
  pinHash?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  fingerprintEnabled: boolean;
  faceUnlockEnabled: boolean;
  notifyVerification: boolean;
  notifyExpiry: boolean;
  notifySecurity: boolean;
  publicProfile: boolean;
  showQRByDefault: boolean;
}

const identitySettingsSchema = new Schema<IIdentitySettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true },
    pinEnabled: { type: Boolean, default: false },
    pinHash: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    fingerprintEnabled: { type: Boolean, default: false },
    faceUnlockEnabled: { type: Boolean, default: false },
    notifyVerification: { type: Boolean, default: true },
    notifyExpiry: { type: Boolean, default: true },
    notifySecurity: { type: Boolean, default: true },
    publicProfile: { type: Boolean, default: false },
    showQRByDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const IdentitySettings = mongoose.model<IIdentitySettings>(
  'IdentitySettings',
  identitySettingsSchema
);
