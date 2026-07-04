import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsAmbulance extends Document {
  ambulanceId: string;
  plateNumber: string;
  callSign: string;
  type: 'type_1' | 'type_2' | 'type_3' | 'fly_car' | 'helicopter';
  unitId?: string;
  status: 'available' | 'in_service' | 'maintenance' | 'offline';
  equipment: string[];
  mileage: number;
  lastServiceAt?: Date;
  latitude?: number;
  longitude?: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const emsAmbulanceSchema = new Schema<IEmsAmbulance>(
  {
    ambulanceId: { type: String, required: true, unique: true, index: true },
    plateNumber: { type: String, required: true, unique: true, index: true },
    callSign: { type: String, required: true },
    type: { type: String, enum: ['type_1', 'type_2', 'type_3', 'fly_car', 'helicopter'], default: 'type_1' },
    unitId: { type: String, index: true },
    status: { type: String, enum: ['available', 'in_service', 'maintenance', 'offline'], default: 'available', index: true },
    equipment: { type: [String], default: [] },
    mileage: { type: Number, default: 0 },
    lastServiceAt: { type: Date },
    latitude: { type: Number },
    longitude: { type: Number },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsAmbulance = mongoose.model<IEmsAmbulance>('EmsAmbulance', emsAmbulanceSchema);
