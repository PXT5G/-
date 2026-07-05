import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftFinance extends Document {
  financeId: string;
  aircraftId: string;
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

const aircraftFinanceSchema = new Schema<IAircraftFinance>(
  {
    financeId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
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

export const AircraftFinance = mongoose.model<IAircraftFinance>('AircraftFinance', aircraftFinanceSchema);
