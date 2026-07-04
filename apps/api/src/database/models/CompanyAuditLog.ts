import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICompanyAuditLog extends Document {
  logId: string;
  companyId: string;
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

const companyAuditLogSchema = new Schema<ICompanyAuditLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
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

export const CompanyAuditLog = mongoose.model<ICompanyAuditLog>('CompanyAuditLog', companyAuditLogSchema);
