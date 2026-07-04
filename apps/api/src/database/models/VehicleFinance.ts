import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleFinance extends Document {
  financeId: string;
  vehicleId: string;
  saleId?: string;
  buyerUserId: Types.ObjectId;
  companyId?: string;
  type: 'installment' | 'bank_financing' | 'leasing';
  principal: number;
  downPayment: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted';
  lender: string;
  payments: { paymentId: string; amount: number; paidAt: Date }[];
  approvedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleFinanceSchema = new Schema<IVehicleFinance>(
  {
    financeId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    saleId: { type: String, index: true },
    buyerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: String, index: true },
    type: { type: String, enum: ['installment', 'bank_financing', 'leasing'], required: true },
    principal: { type: Number, required: true, min: 0 },
    downPayment: { type: Number, default: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    termMonths: { type: Number, required: true, min: 1 },
    monthlyPayment: { type: Number, required: true, min: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'approved', 'active', 'paid', 'defaulted'], default: 'pending', index: true },
    lender: { type: String, required: true },
    payments: { type: [{ paymentId: String, amount: Number, paidAt: Date }], default: [] },
    approvedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const VehicleFinance = mongoose.model<IVehicleFinance>('VehicleFinance', vehicleFinanceSchema);
