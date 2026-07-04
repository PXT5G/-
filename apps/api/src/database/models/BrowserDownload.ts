import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DownloadType, DownloadStatus } from '../../constants/browser';

export interface IBrowserDownload extends Document {
  downloadId: string;
  userId: Types.ObjectId;
  url: string;
  filename: string;
  mimeType: string;
  downloadType: DownloadType;
  status: DownloadStatus;
  size: number;
  downloadedBytes: number;
  progress: number;
  storagePath?: string;
  scanStatus: 'pending' | 'clean' | 'blocked';
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

const browserDownloadSchema = new Schema<IBrowserDownload>(
  {
    downloadId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    downloadType: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    size: { type: Number, default: 0 },
    downloadedBytes: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    storagePath: { type: String },
    scanStatus: { type: String, enum: ['pending', 'clean', 'blocked'], default: 'pending' },
    errorMessage: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const BrowserDownload = mongoose.model<IBrowserDownload>('BrowserDownload', browserDownloadSchema);
