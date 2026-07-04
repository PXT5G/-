import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsDutyLog extends Document {
  logId: string;
  personnelId: Types.ObjectId;
  badgeNumber: string;
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

const emsDutyLogSchema = new Schema<IEmsDutyLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    personnelId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeNumber: { type: String, required: true, index: true },
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

export const EmsDutyLog = mongoose.model<IEmsDutyLog>('EmsDutyLog', emsDutyLogSchema);
