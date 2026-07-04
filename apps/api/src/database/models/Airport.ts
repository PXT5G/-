import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { AirportType } from '../../constants/aviation';

export interface IAirport extends Document {
  airportId: string;
  code: string;
  name: string;
  type: AirportType;
  city: string;
  district: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  runwayCount: number;
  hangarCount: number;
  hasFuelStation: boolean;
  hasMaintenance: boolean;
  isGovernment: boolean;
  isMilitary: boolean;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  status: 'active' | 'closed' | 'restricted';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const airportSchema = new Schema<IAirport>(
  {
    airportId: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: { type: String, enum: ['airport', 'private_hangar', 'government_hangar', 'military_base', 'helipad'], default: 'airport', index: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    country: { type: String, default: 'GULF' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    elevation: { type: Number, default: 0 },
    runwayCount: { type: Number, default: 0 },
    hangarCount: { type: Number, default: 0 },
    hasFuelStation: { type: Boolean, default: false },
    hasMaintenance: { type: Boolean, default: false },
    isGovernment: { type: Boolean, default: false, index: true },
    isMilitary: { type: Boolean, default: false, index: true },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'closed', 'restricted'], default: 'active', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Airport = mongoose.model<IAirport>('Airport', airportSchema);
