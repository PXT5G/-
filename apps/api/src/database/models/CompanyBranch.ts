import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyBranch extends Document {
  branchId: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  managerUserId?: mongoose.Types.ObjectId;
  employeeCount: number;
  status: 'active' | 'inactive' | 'closed';
  isHeadquarters: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyBranchSchema = new Schema<ICompanyBranch>(
  {
    branchId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true, index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, required: true },
    email: { type: String },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active', index: true },
    isHeadquarters: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyBranchSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const CompanyBranch = mongoose.model<ICompanyBranch>('CompanyBranch', companyBranchSchema);
