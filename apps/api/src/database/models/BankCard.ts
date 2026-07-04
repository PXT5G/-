import mongoose, { Schema, Document, Types } from 'mongoose';

export type CardType = 'debit' | 'credit' | 'premium_black';
export type CardStatus = 'active' | 'frozen' | 'blocked' | 'expired';

export interface IBankCard extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  type: CardType;
  cardNumber: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  pinHash?: string;
  frozen: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  monthlySpent: number;
  status: CardStatus;
  holderName: string;
  createdAt: Date;
  updatedAt: Date;
}

const bankCardSchema = new Schema<IBankCard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    type: { type: String, enum: ['debit', 'credit', 'premium_black'], required: true },
    cardNumber: { type: String, required: true, unique: true },
    last4: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    pinHash: { type: String, select: false },
    frozen: { type: Boolean, default: false },
    dailyLimit: { type: Number, default: 5000 },
    monthlyLimit: { type: Number, default: 50000 },
    monthlySpent: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'frozen', 'blocked', 'expired'], default: 'active' },
    holderName: { type: String, required: true },
  },
  { timestamps: true }
);

export const BankCard = mongoose.model<IBankCard>('BankCard', bankCardSchema);

export function generateCardNumber(): string {
  const prefix = '4532';
  let num = prefix;
  for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10);
  return num;
}
