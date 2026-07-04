import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyTenant extends Document {
  tenantId: string;
  userId: Types.ObjectId;
  propertyId?: string;
  leaseId?: string;
  name: string;
  email?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  rentalHistory: { propertyId: string; leaseId: string; startDate: Date; endDate?: Date }[];
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyTenantSchema = new Schema<IPropertyTenant>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: String, index: true },
    leaseId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    reviewCount: { type: Number, default: 0 },
    rentalHistory: { type: [{ propertyId: String, leaseId: String, startDate: Date, endDate: Date }], default: [] },
    isBlacklisted: { type: Boolean, default: false, index: true },
    blacklistReason: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyTenant = mongoose.model<IPropertyTenant>('PropertyTenant', propertyTenantSchema);
