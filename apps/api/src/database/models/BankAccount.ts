import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AccountType } from '../../constants/bank';
import { auditSchemaFields } from '../baseSchema';

export interface IBankAccount extends Document {
  accountId: string;
  userId: Types.ObjectId;
  accountType: AccountType;
  accountNumber: string;
  iban: string;
  walletId: string;
  name: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
  isPrimary: boolean;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountType: { type: String, required: true, index: true },
    accountNumber: { type: String, required: true, unique: true },
    iban: { type: String, required: true, unique: true },
    walletId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    currency: { type: String, default: 'GULF' },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    frozenBalance: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

bankAccountSchema.index({ userId: 1, isPrimary: -1 });

export const BankAccount = mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);
