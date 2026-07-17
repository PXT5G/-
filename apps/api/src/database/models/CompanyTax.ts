import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyTax extends Document {
  taxId: string;
  companyId: string;
  taxType: string;
  period: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  dueDate: Date;
  paidAt?: Date;
  filedAt?: Date;
  reference?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyTaxSchema = new Schema<ICompanyTax>(
  {
    taxId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    taxType: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    taxableAmount: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'filed', 'paid', 'overdue'], default: 'pending', index: true },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    filedAt: { type: Date },
    reference: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyTax = mongoose.model<ICompanyTax>('CompanyTax', companyTaxSchema);
