import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInstalledPackage extends Document {
  userId: Types.ObjectId;
  phoneId?: string;
  characterRecordId?: string;
  bundleId: string;
  packageId: string;
  version: string;
  buildNumber: string;
  size: number;
  installedSize: number;
  cacheSize: number;
  dataSize: number;
  developer: string;
  permissions: string[];
  dependencies: string[];
  installDate: Date;
  lastUpdate: Date;
  digitalSignature: string;
  updatedAt: Date;
}

const installedPackageSchema = new Schema<IInstalledPackage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneId: { type: String, index: true },
    characterRecordId: { type: String, index: true },
    bundleId: { type: String, required: true },
    packageId: { type: String, required: true },
    version: { type: String, required: true },
    buildNumber: { type: String, default: '1' },
    size: { type: Number, default: 0 },
    installedSize: { type: Number, default: 0 },
    cacheSize: { type: Number, default: 0 },
    dataSize: { type: Number, default: 0 },
    developer: { type: String, default: 'Unknown' },
    permissions: [{ type: String }],
    dependencies: [{ type: String }],
    installDate: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
    digitalSignature: { type: String, default: '' },
  },
  { timestamps: true }
);

installedPackageSchema.index({ userId: 1, bundleId: 1 }, { unique: true });

export const InstalledPackage = mongoose.model<IInstalledPackage>(
  'InstalledPackage',
  installedPackageSchema
);
