import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyPayroll extends Document {
  payrollId: string;
  companyId: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  bonus: number;
  commission: number;
  deductions: number;
  netPay: number;
  status: 'pending' | 'processed' | 'paid' | 'failed';
  processedAt?: Date;
  paidAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyPayrollSchema = new Schema<ICompanyPayroll>(
  {
    payrollId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    baseSalary: { type: Number, required: true, min: 0 },
    bonus: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'processed', 'paid', 'failed'], default: 'pending', index: true },
    processedAt: { type: Date },
    paidAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyPayrollSchema.index({ companyId: 1, employeeId: 1, period: 1 }, { unique: true });

export const CompanyPayroll = mongoose.model<ICompanyPayroll>('CompanyPayroll', companyPayrollSchema);
