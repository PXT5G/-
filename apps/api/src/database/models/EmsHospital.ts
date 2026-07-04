import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsHospital extends Document {
  hospitalId: string;
  name: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string;
  traumaLevel: number;
  totalBeds: number;
  availableBeds: number;
  erCapacity: number;
  erOccupied: number;
  orCount: number;
  orAvailable: number;
  departments: string[];
  status: 'open' | 'diversion' | 'closed';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const emsHospitalSchema = new Schema<IEmsHospital>(
  {
    hospitalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    phone: { type: String, required: true },
    traumaLevel: { type: Number, default: 1, min: 1, max: 5 },
    totalBeds: { type: Number, default: 100 },
    availableBeds: { type: Number, default: 100, index: true },
    erCapacity: { type: Number, default: 20 },
    erOccupied: { type: Number, default: 0 },
    orCount: { type: Number, default: 4 },
    orAvailable: { type: Number, default: 4 },
    departments: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'diversion', 'closed'], default: 'open', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsHospital = mongoose.model<IEmsHospital>('EmsHospital', emsHospitalSchema);
