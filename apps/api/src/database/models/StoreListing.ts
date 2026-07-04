import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AppCategory, PermissionType } from '@bananaos/shared';

export interface IStoreListing extends Document {
  appId: Types.ObjectId;
  bundleId: string;
  developerId: Types.ObjectId;
  tagline: string;
  longDescription: string;
  screenshots: string[];
  videoUrl?: string;
  featured: boolean;
  trending: boolean;
  editorsChoice: boolean;
  recommended: boolean;
  verified: boolean;
  premium: boolean;
  price: number;
  currency: string;
  ratingAverage: number;
  ratingCount: number;
  downloadCount: number;
  storageSize: number;
  category: AppCategory;
  tags: string[];
  trendingScore: number;
  minOSVersion: string;
  permissions: PermissionType[];
  createdAt: Date;
  updatedAt: Date;
}

const storeListingSchema = new Schema<IStoreListing>(
  {
    appId: { type: Schema.Types.ObjectId, ref: 'App', required: true, unique: true },
    bundleId: { type: String, required: true, unique: true, index: true },
    developerId: { type: Schema.Types.ObjectId, ref: 'Developer', required: true, index: true },
    tagline: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    screenshots: [{ type: String }],
    videoUrl: { type: String },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    editorsChoice: { type: Boolean, default: false, index: true },
    recommended: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    storageSize: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ['system', 'productivity', 'communication', 'media', 'utilities', 'finance', 'social'],
      default: 'utilities',
    },
    tags: [{ type: String }],
    trendingScore: { type: Number, default: 0, index: true },
    minOSVersion: { type: String, default: '1.0.0' },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

storeListingSchema.index({ tagline: 'text', tags: 'text' });

export const StoreListing = mongoose.model<IStoreListing>('StoreListing', storeListingSchema);
