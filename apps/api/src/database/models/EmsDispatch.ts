import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { EmsDispatchStatus } from '../../constants/ems';

export interface IEmsDispatch extends Document {
  dispatchId: string;
  callType: string;
  priority: number;
  status: EmsDispatchStatus;
  title: string;
  description: string;
  callerName?: string;
  callerPhone?: string;
  patientName?: string;
  patientUserId?: Types.ObjectId;
  address?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  assignedUnitId?: string;
  assignedBadgeNumbers: string[];
  assignedPersonnelIds: Types.ObjectId[];
  destinationHospitalId?: string;
  etaMinutes?: number;
  is911: boolean;
  isMassCasualty: boolean;
  isHelicopter: boolean;
  policeDispatchId?: string;
  incidentId?: string;
  patientCount: number;
  resolvedAt?: Date;
  notes: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsDispatchSchema = new Schema<IEmsDispatch>(
  {
    dispatchId: { type: String, required: true, unique: true, index: true },
    callType: { type: String, required: true, index: true },
    priority: { type: Number, enum: [1, 2, 3], default: 2, index: true },
    status: { type: String, enum: ['pending', 'assigned', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'resolved', 'cancelled'], default: 'pending', index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    callerName: { type: String },
    callerPhone: { type: String, index: true },
    patientName: { type: String, index: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String, index: true },
    assignedUnitId: { type: String, index: true },
    assignedBadgeNumbers: { type: [String], default: [] },
    assignedPersonnelIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    destinationHospitalId: { type: String, index: true },
    etaMinutes: { type: Number },
    is911: { type: Boolean, default: false, index: true },
    isMassCasualty: { type: Boolean, default: false, index: true },
    isHelicopter: { type: Boolean, default: false },
    policeDispatchId: { type: String, index: true },
    incidentId: { type: String, index: true },
    patientCount: { type: Number, default: 1 },
    resolvedAt: { type: Date },
    notes: { type: [String], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsDispatch = mongoose.model<IEmsDispatch>('EmsDispatch', emsDispatchSchema);
