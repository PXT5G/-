import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyRental extends Document {
  rentalId: string;
  propertyId: string;
  status: 'available' | 'occupied' | 'maintenance' | 'eviction_pending';
  monthlyRent: number;
  weeklyRent: number;
  dailyRent: number;
  securityDeposit: number;
  currency: string;
  currentLeaseId?: string;
  currentTenantId?: string;
  rentalHistory: { tenantId: string; leaseId: string; startDate: Date; endDate?: Date; totalPaid: number }[];
  latePaymentCount: number;
  totalRevenue: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyRentalSchema = new Schema<IPropertyRental>(
  {
    rentalId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['available', 'occupied', 'maintenance', 'eviction_pending'], default: 'available', index: true },
    monthlyRent: { type: Number, default: 0 },
    weeklyRent: { type: Number, default: 0 },
    dailyRent: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    currency: { type: String, default: 'GULF' },
    currentLeaseId: { type: String, index: true },
    currentTenantId: { type: String, index: true },
    rentalHistory: { type: [{ tenantId: String, leaseId: String, startDate: Date, endDate: Date, totalPaid: Number }], default: [] },
    latePaymentCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyRental = mongoose.model<IPropertyRental>('PropertyRental', propertyRentalSchema);
