import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { BackupType, BackupState } from '../../constants/deviceEcosystem';

export interface IDeviceBackup extends Document {
  userId: Types.ObjectId;
  backupId: string;
  backupType: BackupType;
  state: BackupState;
  version: number;
  sizeBytes: number;
  includes: string[];
  storagePath: string;
  checksum: string;
  errorMessage?: string;
  completedAt?: Date;
  restoredAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const deviceBackupSchema = new Schema<IDeviceBackup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    backupId: { type: String, required: true, unique: true, index: true },
    backupType: { type: String, enum: ['automatic', 'manual'], required: true },
    state: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'restoring'], default: 'queued', index: true },
    version: { type: Number, default: 1 },
    sizeBytes: { type: Number, default: 0 },
    includes: [{ type: String }],
    storagePath: { type: String, default: '' },
    checksum: { type: String, default: '' },
    errorMessage: { type: String },
    completedAt: { type: Date },
    restoredAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

deviceBackupSchema.index({ userId: 1, version: -1 });

export const DeviceBackup = mongoose.model<IDeviceBackup>('DeviceBackup', deviceBackupSchema);
