import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { CameraMode } from '../../constants/systemApps';

export interface IGalleryItem extends Document {
  userId: Types.ObjectId;
  itemId: string;
  albumId?: string;
  type: 'photo' | 'video';
  name: string;
  sizeBytes: number;
  mode?: CameraMode;
  megapixels?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  favorite: boolean;
  hidden: boolean;
  trashed: boolean;
  trashedAt?: Date;
  aiCategory?: string;
  metadata: Record<string, unknown>;
  capturedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const galleryItemSchema = new Schema<IGalleryItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: String, required: true, index: true },
    albumId: { type: String, index: true },
    type: { type: String, enum: ['photo', 'video'], required: true },
    name: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    mode: { type: String },
    megapixels: { type: Number },
    durationSeconds: { type: Number },
    width: { type: Number },
    height: { type: Number },
    favorite: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date },
    aiCategory: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    capturedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

galleryItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });
galleryItemSchema.index({ userId: 1, trashed: 1, hidden: 1 });

export const GalleryItem = mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema);
