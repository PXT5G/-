import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContactAuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  performedByRole: string;
  permission: string;
  deviceId?: string;
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: Date;
}

const contactAuditLogSchema = new Schema<IContactAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    permission: { type: String, required: true },
    deviceId: { type: String },
    ipAddress: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ContactAuditLog = mongoose.model<IContactAuditLog>('ContactAuditLog', contactAuditLogSchema);
