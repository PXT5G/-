import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IDeviceEcosystemAuditLog extends Document {
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  subsystem: string;
  resourceId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const deviceEcosystemAuditLogSchema = new Schema<IDeviceEcosystemAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    subsystem: { type: String, required: true, index: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const DeviceEcosystemAuditLog = mongoose.model<IDeviceEcosystemAuditLog>(
  'DeviceEcosystemAuditLog',
  deviceEcosystemAuditLogSchema
);
