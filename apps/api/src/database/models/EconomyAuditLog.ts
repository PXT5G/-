import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEconomyAuditLog extends Document {
  logId: string;
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
}

const economyAuditLogSchema = new Schema<IEconomyAuditLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    deviceUuid: { type: String },
  },
  { timestamps: true }
);

export const EconomyAuditLog = mongoose.model<IEconomyAuditLog>('EconomyAuditLog', economyAuditLogSchema);
