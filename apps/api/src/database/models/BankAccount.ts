import mongoose, { Schema, Document, Types } from 'mongoose';

export type AccountType = 'current' | 'savings' | 'business' | 'wallet';
export type AccountStatus = 'active' | 'frozen' | 'suspended' | 'closed';

export interface IBankAccount extends Document {
  userId: Types.ObjectId;
  identityId: Types.ObjectId;
  type: AccountType;
  accountNumber: string;
  iban: string;
  alias?: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true },
    type: { type: String, enum: ['current', 'savings', 'business', 'wallet'], required: true },
    accountNumber: { type: String, required: true, unique: true },
    iban: { type: String, required: true, unique: true },
    alias: { type: String, trim: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'BNA' },
    status: { type: String, enum: ['active', 'frozen', 'suspended', 'closed'], default: 'active' },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bankAccountSchema.index({ userId: 1, type: 1 });

export const BankAccount = mongoose.model<IBankAccount>('BankAccount', bankAccountSchema);

export function generateAccountNumber(): string {
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `BNK-${num}`;
}

export function generateIban(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '').padStart(16, '0').slice(0, 16);
  return `BR12BANA${digits}`;
}
