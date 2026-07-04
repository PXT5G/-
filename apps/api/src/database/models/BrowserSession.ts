import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  incognito: boolean;
  deviceUuid?: string;
  activeTabId?: string;
  lastActiveAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserSessionSchema = new Schema<IBrowserSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    incognito: { type: Boolean, default: false, index: true },
    deviceUuid: { type: String },
    activeTabId: { type: String },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BrowserSession = mongoose.model<IBrowserSession>('BrowserSession', browserSessionSchema);
