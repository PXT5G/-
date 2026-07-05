import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftHangar extends Document {
  hangarId: string;
  airportId: string;
  name: string;
  type: 'private' | 'government' | 'military' | 'commercial';
  capacity: number;
  occupiedSlots: number;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  monthlyRate: number;
  hasMaintenance: boolean;
  status: 'available' | 'full' | 'maintenance' | 'closed';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftHangarSchema = new Schema<IAircraftHangar>(
  {
    hangarId: { type: String, required: true, unique: true, index: true },
    airportId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['private', 'government', 'military', 'commercial'], default: 'commercial', index: true },
    capacity: { type: Number, required: true, min: 1 },
    occupiedSlots: { type: Number, default: 0 },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    monthlyRate: { type: Number, default: 0 },
    hasMaintenance: { type: Boolean, default: false },
    status: { type: String, enum: ['available', 'full', 'maintenance', 'closed'], default: 'available', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const AircraftHangar = mongoose.model<IAircraftHangar>('AircraftHangar', aircraftHangarSchema);
