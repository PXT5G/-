import mongoose, { Schema, Document, Types } from 'mongoose';

export type DownloadStatus = 'queued' | 'downloading' | 'installing' | 'completed' | 'failed' | 'cancelled';
export type DownloadType = 'install' | 'update';

export interface IStoreDownload extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  appName: string;
  appIcon: string;
  type: DownloadType;
  status: DownloadStatus;
  progress: number;
  version: string;
  targetVersion: string;
  size: number;
  downloadedBytes: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

const storeDownloadSchema = new Schema<IStoreDownload>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    appName: { type: String, required: true },
    appIcon: { type: String, required: true },
    type: { type: String, enum: ['install', 'update'], required: true },
    status: {
      type: String,
      enum: ['queued', 'downloading', 'installing', 'completed', 'failed', 'cancelled'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    version: { type: String, default: '' },
    targetVersion: { type: String, required: true },
    size: { type: Number, default: 0 },
    downloadedBytes: { type: Number, default: 0 },
    error: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const StoreDownload = mongoose.model<IStoreDownload>('StoreDownload', storeDownloadSchema);
