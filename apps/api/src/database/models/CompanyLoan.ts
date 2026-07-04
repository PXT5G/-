import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyLoan extends Document {
  loanId: string;
  companyId: string;
  lender: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: 'active' | 'paid' | 'defaulted' | 'restructured';
  startDate: Date;
  endDate?: Date;
  payments: { paymentId: string; amount: number; paidAt: Date }[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyLoanSchema = new Schema<ICompanyLoan>(
  {
    loanId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    lender: { type: String, required: true },
    principal: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    termMonths: { type: Number, required: true, min: 1 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['active', 'paid', 'defaulted', 'restructured'],
      default: 'active',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    payments: { type: [{ paymentId: String, amount: Number, paidAt: Date }], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyLoan = mongoose.model<ICompanyLoan>('CompanyLoan', companyLoanSchema);
