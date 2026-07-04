import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatTrustedDevice extends Document {
  deviceId: string;
  userId: Types.ObjectId;
  deviceUuid: string;
  name: string;
  verified: boolean;
  verifiedAt?: Date;
  lastActiveAt: Date;
  createdAt?: Date;
}

const chatTrustedDeviceSchema = new Schema<IChatTrustedDevice>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceUuid: { type: String, required: true, index: true },
    name: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatTrustedDeviceSchema.index({ userId: 1, deviceUuid: 1 }, { unique: true });

export const ChatTrustedDevice = mongoose.model<IChatTrustedDevice>('ChatTrustedDevice', chatTrustedDeviceSchema);
