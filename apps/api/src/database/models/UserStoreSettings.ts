import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserStoreSettings extends Document {
  userId: Types.ObjectId;
  autoUpdate: boolean;
  cellularDownloads: boolean;
  notifyUpdates: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userStoreSettingsSchema = new Schema<IUserStoreSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    autoUpdate: { type: Boolean, default: true },
    cellularDownloads: { type: Boolean, default: false },
    notifyUpdates: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserStoreSettings = mongoose.model<IUserStoreSettings>(
  'UserStoreSettings',
  userStoreSettingsSchema
);
