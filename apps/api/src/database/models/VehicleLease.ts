import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleLease extends Document {
  leaseId: string;
  vehicleId: string;
  lesseeUserId: Types.ObjectId;
  lessorUserId: Types.ObjectId;
  companyId?: string;
  monthlyPayment: number;
  securityDeposit: number;
  mileageLimit: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  totalPaid: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleLeaseSchema = new Schema<IVehicleLease>(
  {
    leaseId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    lesseeUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: String, index: true },
    monthlyPayment: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0 },
    mileageLimit: { type: Number, default: 12000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'active', 'expired', 'terminated'], default: 'draft', index: true },
    totalPaid: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const VehicleLease = mongoose.model<IVehicleLease>('VehicleLease', vehicleLeaseSchema);
