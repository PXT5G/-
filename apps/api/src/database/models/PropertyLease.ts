import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyLease extends Document {
  leaseId: string;
  propertyId: string;
  rentalId: string;
  tenantId: string;
  landlordUserId: Types.ObjectId;
  companyId?: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  autoRenew: boolean;
  latePayments: { dueDate: Date; amount: number; paidAt?: Date; penalty: number }[];
  paymentsCollected: number;
  documentId?: string;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyLeaseSchema = new Schema<IPropertyLease>(
  {
    leaseId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    rentalId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    landlordUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: String, index: true },
    monthlyRent: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'expired', 'terminated', 'renewed'], default: 'draft', index: true },
    autoRenew: { type: Boolean, default: false },
    latePayments: { type: [{ dueDate: Date, amount: Number, paidAt: Date, penalty: Number }], default: [] },
    paymentsCollected: { type: Number, default: 0 },
    documentId: { type: String },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyLease = mongoose.model<IPropertyLease>('PropertyLease', propertyLeaseSchema);
