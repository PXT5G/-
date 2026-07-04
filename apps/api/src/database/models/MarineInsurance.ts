import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineInsurance extends Document {
  insuranceId: string;
  vesselId: string;
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  premium: number;
  deductible: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const marineInsuranceSchema = new Schema<IMarineInsurance>(
  {
    insuranceId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true, unique: true },
    coverageAmount: { type: Number, required: true },
    premium: { type: Number, required: true },
    deductible: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MarineInsurance = mongoose.model<IMarineInsurance>('MarineInsurance', marineInsuranceSchema);
