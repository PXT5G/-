import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { SyncDomain } from '../../constants/deviceEcosystem';

export interface IDeviceSyncJob extends Document {
  userId: Types.ObjectId;
  syncId: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  domains: SyncDomain[];
  state: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  progress: number;
  conflictResolution?: 'source_wins' | 'target_wins' | 'merge';
  payload: Record<string, unknown>;
  errorMessage?: string;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deviceSyncJobSchema = new Schema<IDeviceSyncJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    syncId: { type: String, required: true, unique: true, index: true },
    sourceDeviceId: { type: String, required: true },
    targetDeviceId: { type: String, required: true },
    domains: [{ type: String, enum: ['settings', 'contacts', 'messages', 'apps', 'wallpapers', 'preferences'] }],
    state: { type: String, enum: ['pending', 'syncing', 'completed', 'failed', 'conflict'], default: 'pending', index: true },
    progress: { type: Number, default: 0 },
    conflictResolution: { type: String, enum: ['source_wins', 'target_wins', 'merge'] },
    payload: { type: Schema.Types.Mixed, default: {} },
    errorMessage: { type: String },
    completedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DeviceSyncJob = mongoose.model<IDeviceSyncJob>('DeviceSyncJob', deviceSyncJobSchema);
