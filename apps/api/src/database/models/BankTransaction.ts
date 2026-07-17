import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TransactionType } from '../../constants/bank';
import { auditSchemaFields } from '../baseSchema';

export interface IBankTransaction extends Document {
  transactionId: string;
  userId: Types.ObjectId;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceAfter: number;
  description: string;
  reference?: string;
  counterparty?: string;
  counterpartyIban?: string;
  category?: string;
  merchantName?: string;
  isFraudulent: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bankTransactionSchema = new Schema<IBankTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'GULF' },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    reference: String,
    counterparty: String,
    counterpartyIban: String,
    category: { type: String, index: true },
    merchantName: String,
    isFraudulent: { type: Boolean, default: false, index: true },
    metadata: Schema.Types.Mixed,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

bankTransactionSchema.index({ userId: 1, createdAt: -1 });
bankTransactionSchema.index({ userId: 1, category: 1 });

export const BankTransaction = mongoose.model<IBankTransaction>('BankTransaction', bankTransactionSchema);
