import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { VehicleStatus, VehicleCategory } from '../../constants/vehicles';

export interface IVehicleSpecs {
  engine: string;
  transmission: string;
  fuelType: string;
  horsepower: number;
  torque: number;
  weight: number;
  topSpeed: number;
  acceleration: number;
  driveType: string;
  fuelCapacity: number;
  seatCount: number;
  doorCount: number;
}

export interface IVehicleLocation {
  latitude: number;
  longitude: number;
  district?: string;
  city?: string;
}

export interface IVehicleMod {
  name: string;
  category: string;
  installedAt?: Date;
}

export interface IVehicleRepair {
  repairId: string;
  description: string;
  cost: number;
  performedAt: Date;
}

export interface IVehicle extends Document {
  vehicleId: string;
  vin: string;
  plateNumber: string;
  serialNumber: string;
  brand: string;
  manufacturer: string;
  vehicleModel: string;
  generation?: string;
  trim?: string;
  year: number;
  category: VehicleCategory;
  mileage: number;
  specs: IVehicleSpecs;
  color: string;
  interiorColor: string;
  condition: string;
  mods: IVehicleMod[];
  repairHistory: IVehicleRepair[];
  listPrice: number;
  dealerPrice?: number;
  marketValue: number;
  currency: string;
  status: VehicleStatus;
  ownerUserId?: Types.ObjectId;
  businessOwnerId?: string;
  companyId?: string;
  dealerId?: string;
  inventoryId?: string;
  location?: IVehicleLocation;
  imageIds: string[];
  videoIds: string[];
  documentIds: string[];
  insuranceId?: string;
  warrantyId?: string;
  inspectionId?: string;
  registrationExpiry?: Date;
  isFeatured: boolean;
  isAvailable: boolean;
  favoriteUserIds: Types.ObjectId[];
  viewCount: number;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    vehicleId: { type: String, required: true, unique: true, index: true },
    vin: { type: String, required: true, unique: true, index: true },
    plateNumber: { type: String, required: true, index: true },
    serialNumber: { type: String, required: true, unique: true, index: true },
    brand: { type: String, required: true, index: true },
    manufacturer: { type: String, required: true },
    vehicleModel: { type: String, required: true, index: true },
    generation: { type: String },
    trim: { type: String },
    year: { type: Number, required: true, index: true },
    category: { type: String, required: true, index: true },
    mileage: { type: Number, default: 0, index: true },
    specs: {
      engine: { type: String, default: '' },
      transmission: { type: String, default: 'automatic' },
      fuelType: { type: String, default: 'gasoline' },
      horsepower: { type: Number, default: 0 },
      torque: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      topSpeed: { type: Number, default: 0 },
      acceleration: { type: Number, default: 0 },
      driveType: { type: String, default: 'fwd' },
      fuelCapacity: { type: Number, default: 0 },
      seatCount: { type: Number, default: 5 },
      doorCount: { type: Number, default: 4 },
    },
    color: { type: String, default: '' },
    interiorColor: { type: String, default: '' },
    condition: { type: String, default: 'good' },
    mods: { type: [{ name: String, category: String, installedAt: Date }], default: [] },
    repairHistory: { type: [{ repairId: String, description: String, cost: Number, performedAt: Date }], default: [] },
    listPrice: { type: Number, default: 0, index: true },
    dealerPrice: { type: Number },
    marketValue: { type: Number, default: 0 },
    currency: { type: String, default: 'GULF' },
    status: { type: String, enum: ['draft', 'pending', 'listed', 'reserved', 'under_offer', 'in_auction', 'sold', 'leased', 'off_market', 'archived', 'featured'], default: 'draft', index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    businessOwnerId: { type: String, index: true },
    companyId: { type: String, index: true },
    dealerId: { type: String, index: true },
    inventoryId: { type: String, index: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      district: { type: String },
      city: { type: String },
    },
    imageIds: { type: [String], default: [] },
    videoIds: { type: [String], default: [] },
    documentIds: { type: [String], default: [] },
    insuranceId: { type: String },
    warrantyId: { type: String },
    inspectionId: { type: String },
    registrationExpiry: { type: Date },
    isFeatured: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    favoriteUserIds: { type: [Schema.Types.ObjectId], default: [] },
    viewCount: { type: Number, default: 0 },
    notes: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
