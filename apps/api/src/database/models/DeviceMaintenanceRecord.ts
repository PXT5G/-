import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { MaintenanceAction } from '../../constants/deviceEcosystem';

export interface IDeviceMaintenanceRecord extends Document {
  userId: Types.ObjectId;
  action: MaintenanceAction;
  status: 'running' | 'completed' | 'failed';
  result: Record<string, unknown>;
  bytesFreed?: number;
  itemsProcessed?: number;
  durationMs?: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deviceMaintenanceRecordSchema = new Schema<IDeviceMaintenanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['optimize_storage', 'clear_cache', 'repair_database', 'rebuild_search_index', 'reset_network', 'reset_settings', 'duplicate_detection', 'system_cleanup'],
      required: true,
      index: true,
    },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    result: { type: Schema.Types.Mixed, default: {} },
    bytesFreed: { type: Number },
    itemsProcessed: { type: Number },
    durationMs: { type: Number },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const DeviceMaintenanceRecord = mongoose.model<IDeviceMaintenanceRecord>(
  'DeviceMaintenanceRecord',
  deviceMaintenanceRecordSchema
);
