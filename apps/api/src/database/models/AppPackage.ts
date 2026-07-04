import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppPackage extends Document {
  appId: Types.ObjectId;
  bundleId: string;
  version: string;
  checksum: string;
  size: number;
  minOSVersion: string;
  requiredGULFOSVersion: string;
  dependencies: string[];
  requiredPermissions: string[];
  optionalPermissions: string[];
  storageRequired: number;
  internetRequired: boolean;
  backgroundActivity: boolean;
  icons: string[];
  screenshots: string[];
  changelog: string;
  packagePath: string;
  incrementalFrom?: string;
  createdAt: Date;
}

const appPackageSchema = new Schema<IAppPackage>(
  {
    appId: { type: Schema.Types.ObjectId, ref: 'App', required: true, index: true },
    bundleId: { type: String, required: true, index: true },
    version: { type: String, required: true },
    checksum: { type: String, required: true },
    size: { type: Number, required: true },
    minOSVersion: { type: String, default: '1.0.0' },
    requiredGULFOSVersion: { type: String, default: '1.0.0' },
    dependencies: [{ type: String }],
    requiredPermissions: [{ type: String }],
    optionalPermissions: [{ type: String }],
    storageRequired: { type: Number, default: 0 },
    internetRequired: { type: Boolean, default: true },
    backgroundActivity: { type: Boolean, default: false },
    icons: [{ type: String }],
    screenshots: [{ type: String }],
    changelog: { type: String, default: '' },
    packagePath: { type: String, required: true },
    incrementalFrom: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

appPackageSchema.index({ bundleId: 1, version: 1 }, { unique: true });

export const AppPackage = mongoose.model<IAppPackage>('AppPackage', appPackageSchema);
