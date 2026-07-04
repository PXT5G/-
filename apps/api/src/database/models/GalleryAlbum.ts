import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IGalleryAlbum extends Document {
  userId: Types.ObjectId;
  albumId: string;
  name: string;
  type: 'user' | 'system' | 'hidden' | 'ai';
  coverItemId?: string;
  itemCount: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const galleryAlbumSchema = new Schema<IGalleryAlbum>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    albumId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['user', 'system', 'hidden', 'ai'], default: 'user' },
    coverItemId: { type: String },
    itemCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

galleryAlbumSchema.index({ userId: 1, albumId: 1 }, { unique: true });

export const GalleryAlbum = mongoose.model<IGalleryAlbum>('GalleryAlbum', galleryAlbumSchema);
