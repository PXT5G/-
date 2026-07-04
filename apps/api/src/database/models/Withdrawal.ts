import mongoose, { Schema, Document, Types } from 'mongoose';

export type WithdrawalStatus = 'pending' | 'completed' | 'cancelled' | 'failed';

export interface IWithdrawal extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  receiptNumber: string;
  transactionId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BNA' },
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'failed'], default: 'pending' },
    receiptNumber: { type: String, required: true, unique: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);

export function generateWithdrawalReceipt(): string {
  return `WDR-${Date.now().toString(36).toUpperCase()}`;
}
