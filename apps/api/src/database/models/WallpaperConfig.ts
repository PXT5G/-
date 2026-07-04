import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IWallpaperConfigModel extends Document {
  userId: Types.ObjectId;
  wallpaperId: string;
  type: 'gradient' | 'image' | 'animated';
  lightUrl?: string;
  darkUrl?: string;
  url?: string;
  animatedClass?: string;
  motionEnabled: boolean;
  blurLayers: number;
  parallaxEnabled: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const wallpaperConfigSchema = new Schema<IWallpaperConfigModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    wallpaperId: { type: String, default: 'gulf-gradient' },
    type: { type: String, enum: ['gradient', 'image', 'animated'], default: 'animated' },
    lightUrl: { type: String },
    darkUrl: { type: String },
    url: { type: String },
    animatedClass: { type: String, default: 'wallpaper-gulf' },
    motionEnabled: { type: Boolean, default: true },
    blurLayers: { type: Number, default: 2 },
    parallaxEnabled: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const WallpaperConfigModel = mongoose.model<IWallpaperConfigModel>(
  'WallpaperConfig',
  wallpaperConfigSchema
);
