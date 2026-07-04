import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { VesselStatus, VesselCategory } from '../../constants/marine';

export interface IVesselSpecs {
  engineType: string;
  engineHours: number;
  fuelCapacity: number;
  passengerCapacity: number;
  cargoCapacity: number;
  maximumSpeed: number;
  range: number;
  weight: number;
  length: number;
  width: number;
  draft: number;
}

export interface IVesselLocation {
  latitude: number;
  longitude: number;
  marinaId?: string;
  dockId?: string;
  portId?: string;
  district?: string;
  city?: string;
}

export interface IVesselRepair {
  repairId: string;
  description: string;
  cost: number;
  engineHoursAtRepair: number;
  performedAt: Date;
}

export interface IVessel extends Document {
  vesselId: string;
  registrationNumber: string;
  hullNumber: string;
  serialNumber: string;
  manufacturer: string;
  brand: string;
  vesselModel: string;
  variant?: string;
  year: number;
  category: VesselCategory;
  specs: IVesselSpecs;
  color: string;
  interior: string;
  repairHistory: IVesselRepair[];
  listPrice: number;
  dealerPrice?: number;
  marketValue: number;
  currency: string;
  status: VesselStatus;
  ownerUserId?: Types.ObjectId;
  businessOwnerId?: string;
  companyId?: string;
  dealerId?: string;
  inventoryId?: string;
  location?: IVesselLocation;
  currentMarinaId?: string;
  currentDockId?: string;
  currentPortId?: string;
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

const vesselSchema = new Schema<IVessel>(
  {
    vesselId: { type: String, required: true, unique: true, index: true },
    registrationNumber: { type: String, required: true, unique: true, index: true },
    hullNumber: { type: String, required: true, unique: true, index: true },
    serialNumber: { type: String, required: true, unique: true, index: true },
    manufacturer: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    vesselModel: { type: String, required: true, index: true },
    variant: { type: String },
    year: { type: Number, required: true, index: true },
    category: { type: String, required: true, index: true },
    specs: {
      engineType: { type: String, default: 'outboard' },
      engineHours: { type: Number, default: 0, index: true },
      fuelCapacity: { type: Number, default: 0 },
      passengerCapacity: { type: Number, default: 0, index: true },
      cargoCapacity: { type: Number, default: 0, index: true },
      maximumSpeed: { type: Number, default: 0 },
      range: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      draft: { type: Number, default: 0 },
    },
    color: { type: String, default: '' },
    interior: { type: String, default: '' },
    repairHistory: { type: [{ repairId: String, description: String, cost: Number, engineHoursAtRepair: Number, performedAt: Date }], default: [] },
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
      marinaId: { type: String },
      dockId: { type: String },
      portId: { type: String },
      district: { type: String },
      city: { type: String },
    },
    currentMarinaId: { type: String, index: true },
    currentDockId: { type: String, index: true },
    currentPortId: { type: String, index: true },
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

export const Vessel = mongoose.model<IVessel>('Vessel', vesselSchema);
