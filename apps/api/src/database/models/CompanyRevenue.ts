import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyRevenue extends Document {
  revenueId: string;
  companyId: string;
  branchId?: string;
  source: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  invoiceId?: string;
  customerId?: string;
  recordedBy: mongoose.Types.ObjectId;
  period: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyRevenueSchema = new Schema<ICompanyRevenue>(
  {
    revenueId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    source: { type: String, required: true },
    category: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GULF' },
    description: { type: String },
    invoiceId: { type: String, index: true },
    customerId: { type: String, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyRevenue = mongoose.model<ICompanyRevenue>('CompanyRevenue', companyRevenueSchema);
