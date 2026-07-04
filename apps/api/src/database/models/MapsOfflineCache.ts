import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMapsOfflineCache extends Document {
  userId: Types.ObjectId;
  cacheId: string;
  district: string;
  tileCount: number;
  sizeBytes: number;
  expiresAt: Date;
  downloadedAt: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mapsOfflineCacheSchema = new Schema<IMapsOfflineCache>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cacheId: { type: String, required: true },
    district: { type: String, required: true },
    tileCount: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    downloadedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

mapsOfflineCacheSchema.index({ userId: 1, cacheId: 1 }, { unique: true });

export const MapsOfflineCache = mongoose.model<IMapsOfflineCache>('MapsOfflineCache', mapsOfflineCacheSchema);
