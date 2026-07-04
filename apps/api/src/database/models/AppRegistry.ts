import mongoose, { Schema, Document, Types } from 'mongoose';

export type AppLifecycleState =
  | 'not_installed'
  | 'downloading'
  | 'paused'
  | 'installing'
  | 'installed'
  | 'update_available'
  | 'updating'
  | 'uninstalling'
  | 'disabled'
  | 'failed';

export interface IAppRegistry extends Document {
  userId: Types.ObjectId;
  bundleId: string;
  appId: Types.ObjectId;
  name: string;
  icon: string;
  version: string;
  state: AppLifecycleState;
  route?: string;
  entryPoint?: string;
  category: string;
  permissions: string[];
  notifications: boolean;
  backgroundService: boolean;
  realtimeEvents: string[];
  storagePath: string;
  isSystemApp: boolean;
  hasRuntime: boolean;
  installedAt?: Date;
  updatedAt: Date;
}

const appRegistrySchema = new Schema<IAppRegistry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bundleId: { type: String, required: true },
    appId: { type: Schema.Types.ObjectId, ref: 'App', required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    version: { type: String, required: true },
    state: {
      type: String,
      enum: [
        'not_installed', 'downloading', 'paused', 'installing', 'installed',
        'update_available', 'updating', 'uninstalling', 'disabled', 'failed',
      ],
      default: 'installed',
    },
    route: { type: String },
    entryPoint: { type: String },
    category: { type: String, default: 'utilities' },
    permissions: [{ type: String }],
    notifications: { type: Boolean, default: true },
    backgroundService: { type: Boolean, default: false },
    realtimeEvents: [{ type: String }],
    storagePath: { type: String, required: true },
    isSystemApp: { type: Boolean, default: false },
    hasRuntime: { type: Boolean, default: false },
    installedAt: { type: Date },
  },
  { timestamps: true }
);

appRegistrySchema.index({ userId: 1, bundleId: 1 }, { unique: true });

export const AppRegistry = mongoose.model<IAppRegistry>('AppRegistry', appRegistrySchema);
