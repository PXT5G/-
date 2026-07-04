import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPolicePanicEvent extends Document {
  panicId: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  callsign?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: Types.ObjectId;
  resolvedAt?: Date;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policePanicSchema = new Schema<IPolicePanicEvent>(
  {
    panicId: { type: String, required: true, unique: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true },
    callsign: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    status: { type: String, enum: ['active', 'acknowledged', 'resolved'], default: 'active', index: true },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PolicePanicEvent = mongoose.model<IPolicePanicEvent>('PolicePanicEvent', policePanicSchema);
