import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPropertyInsurance extends Document {
  insuranceId: string;
  propertyId: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  deductible: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
  claims: { claimId: string; amount: number; status: string; filedAt: Date }[];
  documentId?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const propertyInsuranceSchema = new Schema<IPropertyInsurance>(
  {
    insuranceId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    coverageAmount: { type: Number, required: true, min: 0 },
    premium: { type: Number, required: true, min: 0 },
    deductible: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'claimed'], default: 'active', index: true },
    claims: { type: [{ claimId: String, amount: Number, status: String, filedAt: Date }], default: [] },
    documentId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PropertyInsurance = mongoose.model<IPropertyInsurance>('PropertyInsurance', propertyInsuranceSchema);
