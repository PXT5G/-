import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PoliceRole, OfficerStatus } from '../../constants/police';

export interface IPoliceOfficer extends Document {
  userId: Types.ObjectId;
  badgeNumber: string;
  role: PoliceRole;
  rank: string;
  unitId?: string;
  unitCode?: string;
  status: OfficerStatus;
  callsign?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  street?: string;
  postalCode?: string;
  points: number;
  hireDate: Date;
  lastStatusAt?: Date;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeOfficerSchema = new Schema<IPoliceOfficer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    badgeNumber: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, index: true },
    rank: { type: String, required: true },
    unitId: { type: String, index: true },
    unitCode: { type: String },
    status: { type: String, enum: ['on_duty', 'off_duty', 'break', 'en_route', 'on_scene', 'unavailable', 'panic'], default: 'off_duty', index: true },
    callsign: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    street: { type: String },
    postalCode: { type: String },
    points: { type: Number, default: 0 },
    hireDate: { type: Date, default: Date.now },
    lastStatusAt: { type: Date },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceOfficer = mongoose.model<IPoliceOfficer>('PoliceOfficer', policeOfficerSchema);
