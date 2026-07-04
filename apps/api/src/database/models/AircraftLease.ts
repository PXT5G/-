import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftLease extends Document {
  leaseId: string;
  aircraftId: string;
  lessorCompanyId?: string;
  lesseeUserId: Types.ObjectId;
  monthlyRate: number;
  securityDeposit: number;
  termMonths: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftLeaseSchema = new Schema<IAircraftLease>(
  {
    leaseId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
    lessorCompanyId: { type: String, index: true },
    lesseeUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    monthlyRate: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0 },
    termMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'expired', 'terminated'], default: 'draft', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AircraftLease = mongoose.model<IAircraftLease>('AircraftLease', aircraftLeaseSchema);
