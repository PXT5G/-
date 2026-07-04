import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBankSecuritySettings extends Document {
  userId: Types.ObjectId;
  pinEnabled: boolean;
  pinHash?: string;
  twoFactorEnabled: boolean;
  fingerprintEnabled: boolean;
  faceUnlockEnabled: boolean;
  dailyTransferLimit: number;
  singleTransferLimit: number;
  notifyIncoming: boolean;
  notifyOutgoing: boolean;
  notifySecurity: boolean;
}

const bankSecuritySchema = new Schema<IBankSecuritySettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pinEnabled: { type: Boolean, default: false },
    pinHash: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    fingerprintEnabled: { type: Boolean, default: false },
    faceUnlockEnabled: { type: Boolean, default: false },
    dailyTransferLimit: { type: Number, default: 10000 },
    singleTransferLimit: { type: Number, default: 5000 },
    notifyIncoming: { type: Boolean, default: true },
    notifyOutgoing: { type: Boolean, default: true },
    notifySecurity: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BankSecuritySettings = mongoose.model<IBankSecuritySettings>(
  'BankSecuritySettings',
  bankSecuritySchema
);
