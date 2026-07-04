import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITrustedDevice extends Document {
  userId: Types.ObjectId;
  identityId: Types.ObjectId;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  lastUsedAt: Date;
  ipAddress?: string;
  trusted: boolean;
  createdAt: Date;
}

const trustedDeviceSchema = new Schema<ITrustedDevice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, default: 'mobile' },
    lastUsedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    trusted: { type: Boolean, default: true },
  },
  { timestamps: true }
);

trustedDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const TrustedDevice = mongoose.model<ITrustedDevice>('TrustedDevice', trustedDeviceSchema);
