import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneAuditLog extends Document {
  userId: Types.ObjectId;
  callId?: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  performedBy: Types.ObjectId;
  performedByRole: string;
  permission: string;
  deviceId?: string;
  ipAddress?: string;
  phoneNumber?: string;
  query?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: Date;
}

const phoneAuditLogSchema = new Schema<IPhoneAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByRole: { type: String, required: true },
    permission: { type: String, required: true },
    deviceId: { type: String },
    ipAddress: { type: String },
    phoneNumber: { type: String },
    query: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

phoneAuditLogSchema.index({ action: 1, createdAt: -1 });

export const PhoneAuditLog = mongoose.model<IPhoneAuditLog>('PhoneAuditLog', phoneAuditLogSchema);
