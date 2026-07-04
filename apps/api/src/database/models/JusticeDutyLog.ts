import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeDutyLog extends Document {
  logId: string;
  officialId: Types.ObjectId;
  employeeId: string;
  action: string;
  details: string;
  resourceType?: string;
  resourceId?: string;
  deviceUuid?: string;
  ipAddress?: string;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceDutyLogSchema = new Schema<IJusticeDutyLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    officialId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    resourceType: { type: String },
    resourceId: { type: String, index: true },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeDutyLog = mongoose.model<IJusticeDutyLog>('JusticeDutyLog', justiceDutyLogSchema);
