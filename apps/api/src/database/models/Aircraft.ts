import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { AircraftStatus, AircraftCategory } from '../../constants/aviation';

export interface IAircraftSpecs {
  engineType: string;
  engineHours: number;
  fuelCapacity: number;
  passengerCapacity: number;
  cargoCapacity: number;
  cruisingSpeed: number;
  maximumSpeed: number;
  maximumRange: number;
  maximumAltitude: number;
  weight: number;
  wingspan: number;
  length: number;
  height: number;
}

export interface IAircraftLocation {
  latitude: number;
  longitude: number;
  airportId?: string;
  hangarId?: string;
  district?: string;
  city?: string;
}

export interface IAircraftRepair {
  repairId: string;
  description: string;
  cost: number;
  flightHoursAtRepair: number;
  performedAt: Date;
}

export interface IAircraft extends Document {
  aircraftId: string;
  registrationNumber: string;
  serialNumber: string;
  manufacturer: string;
  brand: string;
  aircraftModel: string;
  variant?: string;
  year: number;
  category: AircraftCategory;
  flightHours: number;
  specs: IAircraftSpecs;
  color: string;
  interior: string;
  repairHistory: IAircraftRepair[];
  listPrice: number;
  dealerPrice?: number;
  marketValue: number;
  currency: string;
  status: AircraftStatus;
  ownerUserId?: Types.ObjectId;
  businessOwnerId?: string;
  companyId?: string;
  dealerId?: string;
  inventoryId?: string;
  location?: IAircraftLocation;
  currentAirportId?: string;
  currentHangarId?: string;
  imageIds: string[];
  videoIds: string[];
  documentIds: string[];
  insuranceId?: string;
  inspectionId?: string;
  isFeatured: boolean;
  isAvailable: boolean;
  favoriteUserIds: Types.ObjectId[];
  viewCount: number;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftSchema = new Schema<IAircraft>(
  {
    aircraftId: { type: String, required: true, unique: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, index: true },
    serialNumber: { type: String, required: true, unique: true, index: true },
    manufacturer: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    aircraftModel: { type: String, required: true, index: true },
    variant: { type: String },
    year: { type: Number, required: true, index: true },
    category: { type: String, required: true, index: true },
    flightHours: { type: Number, default: 0, index: true },
    specs: {
      engineType: { type: String, default: 'turbofan' },
      engineHours: { type: Number, default: 0 },
      fuelCapacity: { type: Number, default: 0 },
      passengerCapacity: { type: Number, default: 0, index: true },
      cargoCapacity: { type: Number, default: 0, index: true },
      cruisingSpeed: { type: Number, default: 0 },
      maximumSpeed: { type: Number, default: 0 },
      maximumRange: { type: Number, default: 0 },
      maximumAltitude: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      wingspan: { type: Number, default: 0 },
      length: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    color: { type: String, default: '' },
    interior: { type: String, default: '' },
    repairHistory: { type: [{ repairId: String, description: String, cost: Number, flightHoursAtRepair: Number, performedAt: Date }], default: [] },
    listPrice: { type: Number, default: 0, index: true },
    dealerPrice: { type: Number },
    marketValue: { type: Number, default: 0 },
    currency: { type: String, default: 'GULF' },
    status: { type: String, enum: ['draft', 'pending', 'listed', 'reserved', 'under_offer', 'in_auction', 'sold', 'leased', 'in_maintenance', 'in_transit', 'off_market', 'archived', 'featured'], default: 'draft', index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    businessOwnerId: { type: String, index: true },
    companyId: { type: String, index: true },
    dealerId: { type: String, index: true },
    inventoryId: { type: String, index: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      airportId: { type: String },
      hangarId: { type: String },
      district: { type: String },
      city: { type: String },
    },
    currentAirportId: { type: String, index: true },
    currentHangarId: { type: String, index: true },
    imageIds: { type: [String], default: [] },
    videoIds: { type: [String], default: [] },
    documentIds: { type: [String], default: [] },
    insuranceId: { type: String },
    inspectionId: { type: String },
    isFeatured: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    favoriteUserIds: { type: [Schema.Types.ObjectId], default: [] },
    viewCount: { type: Number, default: 0 },
    notes: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Aircraft = mongoose.model<IAircraft>('Aircraft', aircraftSchema);
