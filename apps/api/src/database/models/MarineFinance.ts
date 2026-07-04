import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineFinance extends Document {
  financeId: string;
  vesselId: string;
  buyerUserId: Types.ObjectId;
  companyId?: string;
  type: 'installment' | 'bank_financing' | 'leasing';
  principal: number;
  downPayment: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  lender: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted';
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const marineFinanceSchema = new Schema<IMarineFinance>(
  {
    financeId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, required: true, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: String, index: true },
    type: { type: String, enum: ['installment', 'bank_financing', 'leasing'], required: true },
    principal: { type: Number, required: true, min: 0 },
    downPayment: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    termMonths: { type: Number, required: true },
    monthlyPayment: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    lender: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'active', 'completed', 'defaulted'], default: 'pending', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MarineFinance = mongoose.model<IMarineFinance>('MarineFinance', marineFinanceSchema);
