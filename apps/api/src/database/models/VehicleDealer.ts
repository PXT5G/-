import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleDealer extends Document {
  dealerId: string;
  companyId: string;
  name: string;
  tradeName: string;
  licenseNumber: string;
  address: string;
  city: string;
  district: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  ownerUserId: Types.ObjectId;
  employeeCount: number;
  inventoryCount: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  inventoryValue: number;
  iban?: string;
  status: 'active' | 'suspended' | 'closed';
  categories: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleDealerSchema = new Schema<IVehicleDealer>(
  {
    dealerId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    tradeName: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true, index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    logo: { type: String },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employeeCount: { type: Number, default: 0 },
    inventoryCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    iban: { type: String },
    status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active', index: true },
    categories: { type: [String], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const VehicleDealer = mongoose.model<IVehicleDealer>('VehicleDealer', vehicleDealerSchema);
