import mongoose, { Schema, Document } from 'mongoose';
import type { AppCategory, PermissionType } from '@bananaos/shared';

export interface IApp extends Document {
  bundleId: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  category: AppCategory;
  permissions: PermissionType[];
  minOSVersion: string;
  isSystemApp: boolean;
  route?: string;
  entryPoint?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appSchema = new Schema<IApp>(
  {
    bundleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: ['system', 'productivity', 'communication', 'media', 'utilities', 'finance', 'social'],
      default: 'utilities',
    },
    permissions: [{ type: String }],
    minOSVersion: { type: String, default: '1.0.0' },
    isSystemApp: { type: Boolean, default: false },
    route: { type: String },
    entryPoint: { type: String },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const App = mongoose.model<IApp>('App', appSchema);
