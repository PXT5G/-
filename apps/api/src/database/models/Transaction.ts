import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionType =
  | 'transfer_in'
  | 'transfer_out'
  | 'deposit'
  | 'withdrawal'
  | 'payment'
  | 'fee'
  | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
export type TransactionDirection = 'income' | 'expense';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  balanceAfter: number;
  status: TransactionStatus;
  category: string;
  description: string;
  reference: string;
  counterpartyUserId?: Types.ObjectId;
  counterpartyAccountId?: Types.ObjectId;
  counterpartyName?: string;
  location?: string;
  metadata?: Record<string, unknown>;
  relatedId?: Types.ObjectId;
  relatedModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true, index: true },
    type: {
      type: String,
      enum: ['transfer_in', 'transfer_out', 'deposit', 'withdrawal', 'payment', 'fee', 'refund'],
      required: true,
    },
    direction: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BNA' },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    category: { type: String, default: 'general' },
    description: { type: String, required: true },
    reference: { type: String, required: true, unique: true, index: true },
    counterpartyUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    counterpartyAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    counterpartyName: { type: String },
    location: { type: String },
    metadata: { type: Schema.Types.Mixed },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export function generateReference(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TXN-${ts}-${rand}`;
}
