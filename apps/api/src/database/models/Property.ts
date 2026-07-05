import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PropertyStatus, PropertyType, OwnershipType } from '../../constants/realEstate';

export interface IPropertyLocation {
  country: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  mapMarkerId?: string;
}

export interface IPropertyAmenities {
  swimmingPool: boolean;
  garden: boolean;
  gym: boolean;
  elevators: number;
  parkingSpaces: number;
  storageRooms: number;
}

export interface IPropertyUtilities {
  internetAvailable: boolean;
  powerStatus: 'active' | 'inactive' | 'pending' | 'disconnected';
  waterStatus: 'active' | 'inactive' | 'pending' | 'disconnected';
}

export interface IOwnershipRecord {
  ownerId: string;
  ownerType: OwnershipType;
  userId?: Types.ObjectId;
  companyId?: string;
  sharePercent: number;
  acquiredAt: Date;
  releasedAt?: Date;
}

export interface IProperty extends Document {
  propertyId: string;
  propertyNumber: string;
  title: string;
  description: string;
  category: PropertyType;
  status: PropertyStatus;
  ownershipType: OwnershipType;
  ownerUserId?: Types.ObjectId;
  businessOwnerId?: string;
  developerId?: string;
  builderId?: string;
  companyId?: string;
  location: IPropertyLocation;
  buildingSize: number;
  landSize: number;
  floors: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  amenities: IPropertyAmenities;
  yearBuilt?: number;
  condition: string;
  energyRating: string;
  securityLevel: string;
  utilities: IPropertyUtilities;
  listPrice: number;
  rentPriceMonthly: number;
  rentPriceWeekly: number;
  rentPriceDaily: number;
  marketValue: number;
  currency: string;
  virtualTourUrl?: string;
  notes?: string;
  isFeatured: boolean;
  isAvailable: boolean;
  ownershipHistory: IOwnershipRecord[];
  imageIds: string[];
  videoIds: string[];
  floorPlanIds: string[];
  documentIds: string[];
  favoriteUserIds: Types.ObjectId[];
  viewCount: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const ownershipRecordSchema = new Schema<IOwnershipRecord>(
  {
    ownerId: { type: String, required: true },
    ownerType: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: String },
    sharePercent: { type: Number, default: 100, min: 0, max: 100 },
    acquiredAt: { type: Date, default: Date.now },
    releasedAt: { type: Date },
  },
  { _id: false }
);

const propertySchema = new Schema<IProperty>(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    propertyNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    status: { type: String, enum: ['draft', 'pending_approval', 'listed', 'under_offer', 'under_contract', 'sold', 'rented', 'off_market', 'archived', 'featured'], default: 'draft', index: true },
    ownershipType: { type: String, enum: ['private', 'business', 'government', 'shared', 'company', 'investment', 'fractional'], default: 'private', index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    businessOwnerId: { type: String, index: true },
    developerId: { type: String },
    builderId: { type: String },
    companyId: { type: String, index: true },
    location: {
      country: { type: String, default: 'GULF' },
      city: { type: String, required: true, index: true },
      district: { type: String, required: true, index: true },
      street: { type: String, required: true, index: true },
      postalCode: { type: String, default: '' },
      latitude: { type: Number, required: true, index: true },
      longitude: { type: Number, required: true, index: true },
      mapMarkerId: { type: String },
    },
    buildingSize: { type: Number, default: 0 },
    landSize: { type: Number, default: 0 },
    floors: { type: Number, default: 1 },
    rooms: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0, index: true },
    bathrooms: { type: Number, default: 0, index: true },
    kitchens: { type: Number, default: 1 },
    amenities: {
      swimmingPool: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      elevators: { type: Number, default: 0 },
      parkingSpaces: { type: Number, default: 0 },
      storageRooms: { type: Number, default: 0 },
    },
    yearBuilt: { type: Number },
    condition: { type: String, default: 'good' },
    energyRating: { type: String, default: 'unknown' },
    securityLevel: { type: String, default: 'medium' },
    utilities: {
      internetAvailable: { type: Boolean, default: true },
      powerStatus: { type: String, enum: ['active', 'inactive', 'pending', 'disconnected'], default: 'active' },
      waterStatus: { type: String, enum: ['active', 'inactive', 'pending', 'disconnected'], default: 'active' },
    },
    listPrice: { type: Number, default: 0, index: true },
    rentPriceMonthly: { type: Number, default: 0, index: true },
    rentPriceWeekly: { type: Number, default: 0 },
    rentPriceDaily: { type: Number, default: 0 },
    marketValue: { type: Number, default: 0 },
    currency: { type: String, default: 'GULF' },
    virtualTourUrl: { type: String },
    notes: { type: String },
    isFeatured: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    ownershipHistory: { type: [ownershipRecordSchema], default: [] },
    imageIds: { type: [String], default: [] },
    videoIds: { type: [String], default: [] },
    floorPlanIds: { type: [String], default: [] },
    documentIds: { type: [String], default: [] },
    favoriteUserIds: { type: [Schema.Types.ObjectId], default: [] },
    viewCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

propertySchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
propertySchema.index({ listPrice: 1, bedrooms: 1, category: 1 });

export const Property = mongoose.model<IProperty>('Property', propertySchema);
