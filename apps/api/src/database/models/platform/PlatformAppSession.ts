import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppContext {
  appId: string;
  lastAccessedAt: Date;
  deviceId?: string;
}

export interface IPlatformAppSession extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  activeAppId?: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  appContexts: IAppContext[];
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const platformAppSessionSchema = new Schema<IPlatformAppSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    activeAppId: { type: String },
    deviceId: { type: String },
    deviceName: { type: String },
    ipAddress: { type: String },
    appContexts: [{
      appId: { type: String, required: true },
      lastAccessedAt: { type: Date, default: Date.now },
      deviceId: { type: String },
    }],
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

platformAppSessionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export const PlatformAppSession = mongoose.model<IPlatformAppSession>('PlatformAppSession', platformAppSessionSchema);
