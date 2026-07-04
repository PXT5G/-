import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppStorage extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  appSize: number;
  userDataSize: number;
  cacheSize: number;
  tempSize: number;
  downloadsSize: number;
  logsSize: number;
  documentsSize: number;
  mediaSize: number;
  totalSize: number;
  updatedAt: Date;
}

const appStorageSchema = new Schema<IAppStorage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    appSize: { type: Number, default: 0 },
    userDataSize: { type: Number, default: 0 },
    cacheSize: { type: Number, default: 0 },
    tempSize: { type: Number, default: 0 },
    downloadsSize: { type: Number, default: 0 },
    logsSize: { type: Number, default: 0 },
    documentsSize: { type: Number, default: 0 },
    mediaSize: { type: Number, default: 0 },
    totalSize: { type: Number, default: 0 },
  },
  { timestamps: true }
);

appStorageSchema.index({ userId: 1, bundleId: 1 }, { unique: true });

export const AppStorage = mongoose.model<IAppStorage>('AppStorage', appStorageSchema);
