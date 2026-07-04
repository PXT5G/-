import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyExpense extends Document {
  expenseId: string;
  companyId: string;
  branchId?: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  vendor?: string;
  supplierId?: string;
  approvedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  period: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyExpenseSchema = new Schema<ICompanyExpense>(
  {
    expenseId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    category: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GULF' },
    description: { type: String },
    vendor: { type: String },
    supplierId: { type: String, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending', index: true },
    period: { type: String, required: true, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyExpense = mongoose.model<ICompanyExpense>('CompanyExpense', companyExpenseSchema);
