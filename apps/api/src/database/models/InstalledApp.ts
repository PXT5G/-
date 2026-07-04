import mongoose, { Schema, Document } from 'mongoose';

export interface IInstalledApp extends Document {
  userId: mongoose.Types.ObjectId;
  appId: mongoose.Types.ObjectId;
  bundleId: string;
  installedAt: Date;
  position?: { row: number; col: number };
  folderId?: string;
  pageIndex: number;
}

const installedAppSchema = new Schema<IInstalledApp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appId: { type: Schema.Types.ObjectId, ref: 'App', required: true },
    bundleId: { type: String, required: true },
    installedAt: { type: Date, default: Date.now },
    position: {
      row: { type: Number },
      col: { type: Number },
    },
    folderId: { type: String },
    pageIndex: { type: Number, default: 0 },
  },
  { timestamps: false }
);

installedAppSchema.index({ userId: 1, bundleId: 1 }, { unique: true });

export const InstalledApp = mongoose.model<IInstalledApp>('InstalledApp', installedAppSchema);
