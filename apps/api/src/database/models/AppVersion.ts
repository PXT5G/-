import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppVersion extends Document {
  appId: Types.ObjectId;
  bundleId: string;
  version: string;
  changelog: string;
  releaseDate: Date;
  size: number;
  minOSVersion: string;
  createdAt: Date;
}

const appVersionSchema = new Schema<IAppVersion>(
  {
    appId: { type: Schema.Types.ObjectId, ref: 'App', required: true, index: true },
    bundleId: { type: String, required: true, index: true },
    version: { type: String, required: true },
    changelog: { type: String, default: '' },
    releaseDate: { type: Date, default: Date.now },
    size: { type: Number, default: 0 },
    minOSVersion: { type: String, default: '1.0.0' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

appVersionSchema.index({ bundleId: 1, version: 1 }, { unique: true });

export const AppVersion = mongoose.model<IAppVersion>('AppVersion', appVersionSchema);
