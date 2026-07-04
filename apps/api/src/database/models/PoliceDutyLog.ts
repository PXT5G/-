import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceDutyLog extends Document {
  logId: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  action: string;
  details?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeDutyLogSchema = new Schema<IPoliceDutyLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true },
    action: { type: String, required: true, index: true },
    details: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PoliceDutyLog = mongoose.model<IPoliceDutyLog>('PoliceDutyLog', policeDutyLogSchema);
