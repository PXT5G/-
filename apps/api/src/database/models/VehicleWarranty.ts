import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleWarranty extends Document {
  warrantyId: string;
  vehicleId: string;
  provider: string;
  type: 'manufacturer' | 'extended' | 'dealer';
  coverage: string;
  startDate: Date;
  endDate: Date;
  mileageLimit?: number;
  status: 'active' | 'expired' | 'voided' | 'claimed';
  claims: { claimId: string; description: string; status: string; filedAt: Date }[];
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleWarrantySchema = new Schema<IVehicleWarranty>(
  {
    warrantyId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    type: { type: String, enum: ['manufacturer', 'extended', 'dealer'], required: true },
    coverage: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    mileageLimit: { type: Number },
    status: { type: String, enum: ['active', 'expired', 'voided', 'claimed'], default: 'active', index: true },
    claims: { type: [{ claimId: String, description: String, status: String, filedAt: Date }], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VehicleWarranty = mongoose.model<IVehicleWarranty>('VehicleWarranty', vehicleWarrantySchema);
