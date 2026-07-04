import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { UnitStatus } from '../../constants/ems';

export interface IEmsUnit extends Document {
  unitId: string;
  code: string;
  name: string;
  type: 'ambulance' | 'rapid_response' | 'helicopter' | 'supervisor' | 'mass_casualty';
  status: UnitStatus;
  leaderBadge?: string;
  memberBadges: string[];
  ambulanceId?: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  district?: string;
  hospitalId?: string;
  etaMinutes?: number;
  radioChannel?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const emsUnitSchema = new Schema<IEmsUnit>(
  {
    unitId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['ambulance', 'rapid_response', 'helicopter', 'supervisor', 'mass_casualty'], default: 'ambulance' },
    status: { type: String, enum: ['available', 'dispatched', 'en_route', 'on_scene', 'transporting', 'at_hospital', 'offline'], default: 'available', index: true },
    leaderBadge: { type: String },
    memberBadges: { type: [String], default: [] },
    ambulanceId: { type: String, index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    heading: { type: Number },
    speed: { type: Number },
    district: { type: String },
    hospitalId: { type: String, index: true },
    etaMinutes: { type: Number },
    radioChannel: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsUnit = mongoose.model<IEmsUnit>('EmsUnit', emsUnitSchema);
