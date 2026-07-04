import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICoreAuditLog extends Document {
  appId: string;
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  performedByRole: string;
  permission?: string;
  query?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  details?: string;
  amount?: number;
  ipAddress?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const coreAuditLogSchema = new Schema<ICoreAuditLog>(
  {
    appId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    permission: { type: String },
    query: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    reason: { type: String },
    details: { type: String },
    amount: { type: Number },
    ipAddress: { type: String },
    deviceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

coreAuditLogSchema.index({ appId: 1, createdAt: -1 });
coreAuditLogSchema.index({ action: 1, createdAt: -1 });

export const CoreAuditLog = mongoose.model<ICoreAuditLog>('CoreAuditLog', coreAuditLogSchema);
