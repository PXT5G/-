import mongoose, { Schema, Document, Types } from 'mongoose';

export type DepositMethod = 'cash' | 'manual' | 'admin';
export type DepositStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export interface IDeposit extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  amount: number;
  currency: string;
  method: DepositMethod;
  status: DepositStatus;
  receiptNumber: string;
  transactionId?: Types.ObjectId;
  depositedBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BNA' },
    method: { type: String, enum: ['cash', 'manual', 'admin'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'failed'], default: 'pending' },
    receiptNumber: { type: String, required: true, unique: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    depositedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);

export function generateReceiptNumber(): string {
  return `DEP-${Date.now().toString(36).toUpperCase()}`;
}
