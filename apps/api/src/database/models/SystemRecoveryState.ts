import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { RecoveryMode } from '../../constants/deviceEcosystem';

export interface ISystemRecoveryState extends Document {
  userId: Types.ObjectId;
  recoveryMode: RecoveryMode;
  safeModeEnabled: boolean;
  factoryResetPending: boolean;
  rollbackVersion?: string;
  lastRecoveryAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const systemRecoveryStateSchema = new Schema<ISystemRecoveryState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    recoveryMode: { type: String, enum: ['normal', 'safe', 'recovery'], default: 'normal' },
    safeModeEnabled: { type: Boolean, default: false },
    factoryResetPending: { type: Boolean, default: false },
    rollbackVersion: { type: String },
    lastRecoveryAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const SystemRecoveryState = mongoose.model<ISystemRecoveryState>(
  'SystemRecoveryState',
  systemRecoveryStateSchema
);
