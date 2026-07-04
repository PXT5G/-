import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { JusticeRole, OfficialStatus } from '../../constants/justice';

export interface IJusticeOfficial extends Document {
  userId: Types.ObjectId;
  employeeId: string;
  role: JusticeRole;
  title: string;
  department: string;
  courtroomId?: string;
  status: OfficialStatus;
  barNumber?: string;
  signatureHash?: string;
  hireDate: Date;
  lastStatusAt?: Date;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceOfficialSchema = new Schema<IJusticeOfficial>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, index: true },
    title: { type: String, required: true },
    department: { type: String, default: 'GULF Superior Court' },
    courtroomId: { type: String, index: true },
    status: { type: String, enum: ['on_duty', 'off_duty', 'in_court', 'in_chambers', 'unavailable'], default: 'off_duty', index: true },
    barNumber: { type: String, index: true },
    signatureHash: { type: String },
    hireDate: { type: Date, default: Date.now },
    lastStatusAt: { type: Date },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeOfficial = mongoose.model<IJusticeOfficial>('JusticeOfficial', justiceOfficialSchema);
