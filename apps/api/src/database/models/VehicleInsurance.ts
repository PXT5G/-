import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleInsurance extends Document {
  insuranceId: string;
  vehicleId: string;
  provider: string;
  policyNumber: string;
  coverageType: string;
  premium: number;
  deductible: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
  claims: { claimId: string; amount: number; status: string; filedAt: Date }[];
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleInsuranceSchema = new Schema<IVehicleInsurance>(
  {
    insuranceId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    policyNumber: { type: String, required: true },
    coverageType: { type: String, default: 'comprehensive' },
    premium: { type: Number, required: true, min: 0 },
    deductible: { type: Number, default: 500 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'claimed'], default: 'active', index: true },
    claims: { type: [{ claimId: String, amount: Number, status: String, filedAt: Date }], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VehicleInsurance = mongoose.model<IVehicleInsurance>('VehicleInsurance', vehicleInsuranceSchema);
