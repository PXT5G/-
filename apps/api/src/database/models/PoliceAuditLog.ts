import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoliceAuditLog extends Document {
  userId: Types.ObjectId;
  officerId?: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  performedByRole: string;
  permission: string;
  deviceId?: string;
  ipAddress?: string;
  query?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: Date;
}

const policeAuditLogSchema = new Schema<IPoliceAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    permission: { type: String, required: true },
    deviceId: { type: String },
    ipAddress: { type: String },
    query: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

policeAuditLogSchema.index({ action: 1, createdAt: -1 });

export const PoliceAuditLog = mongoose.model<IPoliceAuditLog>('PoliceAuditLog', policeAuditLogSchema);
