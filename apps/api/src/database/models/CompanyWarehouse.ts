import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyWarehouse extends Document {
  warehouseId: string;
  companyId: string;
  branchId?: string;
  name: string;
  code: string;
  address: string;
  city: string;
  capacity: number;
  currentOccupancy: number;
  managerUserId?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'full';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyWarehouseSchema = new Schema<ICompanyWarehouse>(
  {
    warehouseId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    capacity: { type: Number, default: 1000 },
    currentOccupancy: { type: Number, default: 0 },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive', 'full'], default: 'active', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyWarehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const CompanyWarehouse = mongoose.model<ICompanyWarehouse>('CompanyWarehouse', companyWarehouseSchema);
