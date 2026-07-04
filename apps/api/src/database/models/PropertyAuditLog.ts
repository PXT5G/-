import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPropertyAuditLog extends Document {
  logId: string;
  propertyId?: string;
  userId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  signatureHash?: string;
}

const propertyAuditLogSchema = new Schema<IPropertyAuditLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    signatureHash: { type: String },
  },
  { timestamps: true }
);

export const PropertyAuditLog = mongoose.model<IPropertyAuditLog>('PropertyAuditLog', propertyAuditLogSchema);
