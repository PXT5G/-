import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { EmsRole, PersonnelStatus } from '../../constants/ems';

export interface IEmsPersonnel extends Document {
  userId: Types.ObjectId;
  badgeNumber: string;
  role: EmsRole;
  title: string;
  department: string;
  hospitalId?: string;
  unitId?: string;
  status: PersonnelStatus;
  licenseNumber?: string;
  signatureHash?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  hireDate: Date;
  lastStatusAt?: Date;
  deviceUuid?: string;
  ipAddress?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsPersonnelSchema = new Schema<IEmsPersonnel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    badgeNumber: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true, index: true },
    title: { type: String, required: true },
    department: { type: String, default: 'GULF EMS' },
    hospitalId: { type: String, index: true },
    unitId: { type: String, index: true },
    status: { type: String, enum: ['on_duty', 'off_duty', 'en_route', 'on_scene', 'at_hospital', 'unavailable'], default: 'off_duty', index: true },
    licenseNumber: { type: String, index: true },
    signatureHash: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    hireDate: { type: Date, default: Date.now },
    lastStatusAt: { type: Date },
    deviceUuid: { type: String },
    ipAddress: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsPersonnel = mongoose.model<IEmsPersonnel>('EmsPersonnel', emsPersonnelSchema);
