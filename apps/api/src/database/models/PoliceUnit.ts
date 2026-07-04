import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceUnit extends Document {
  unitId: string;
  code: string;
  name: string;
  type: 'patrol' | 'traffic' | 'detective' | 'swat' | 'air' | 'dispatch' | 'k9';
  leaderBadge?: string;
  memberBadges: string[];
  status: 'available' | 'busy' | 'en_route' | 'on_scene' | 'offline';
  latitude?: number;
  longitude?: number;
  district?: string;
  vehiclePlate?: string;
  radioChannel?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const policeUnitSchema = new Schema<IPoliceUnit>(
  {
    unitId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['patrol', 'traffic', 'detective', 'swat', 'air', 'dispatch', 'k9'], default: 'patrol' },
    leaderBadge: { type: String },
    memberBadges: { type: [String], default: [] },
    status: { type: String, enum: ['available', 'busy', 'en_route', 'on_scene', 'offline'], default: 'available', index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    vehiclePlate: { type: String },
    radioChannel: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceUnit = mongoose.model<IPoliceUnit>('PoliceUnit', policeUnitSchema);
