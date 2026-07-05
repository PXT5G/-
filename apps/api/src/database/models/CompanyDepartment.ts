import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyDepartment extends Document {
  departmentId: string;
  companyId: string;
  branchId?: string;
  name: string;
  code: string;
  description?: string;
  headUserId?: mongoose.Types.ObjectId;
  employeeCount: number;
  budget: number;
  status: 'active' | 'inactive';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyDepartmentSchema = new Schema<ICompanyDepartment>(
  {
    departmentId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String },
    headUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeCount: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyDepartmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const CompanyDepartment = mongoose.model<ICompanyDepartment>('CompanyDepartment', companyDepartmentSchema);
