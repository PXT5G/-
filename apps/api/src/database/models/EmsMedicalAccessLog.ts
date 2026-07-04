import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsMedicalAccessLog extends Document {
  accessId: string;
  recordId: string;
  patientId: string;
  accessedBy: Types.ObjectId;
  badgeNumber: string;
  accessType: 'view' | 'create' | 'update' | 'export';
  reason?: string;
  ipAddress?: string;
  deviceUuid?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsMedicalAccessLogSchema = new Schema<IEmsMedicalAccessLog>(
  {
    accessId: { type: String, required: true, unique: true, index: true },
    recordId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    accessedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    badgeNumber: { type: String, required: true },
    accessType: { type: String, enum: ['view', 'create', 'update', 'export'], required: true },
    reason: { type: String },
    ipAddress: { type: String },
    deviceUuid: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsMedicalAccessLog = mongoose.model<IEmsMedicalAccessLog>('EmsMedicalAccessLog', emsMedicalAccessLogSchema);
