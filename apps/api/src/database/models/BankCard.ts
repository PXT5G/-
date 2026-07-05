import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CardType, CardStatus } from '../../constants/bank';
import { auditSchemaFields } from '../baseSchema';

export interface IBankCard extends Document {
  cardId: string;
  userId: Types.ObjectId;
  accountId: string;
  cardType: CardType;
  status: CardStatus;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  isContactless: boolean;
  isVirtual: boolean;
  frozenAt?: Date;
  replacedBy?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bankCardSchema = new Schema<IBankCard>(
  {
    cardId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: String, required: true, index: true },
    cardType: { type: String, required: true },
    status: { type: String, required: true, default: 'active', index: true },
    lastFour: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    holderName: { type: String, required: true },
    dailyLimit: { type: Number, default: 50000 },
    monthlyLimit: { type: Number, default: 500000 },
    perTransactionLimit: { type: Number, default: 25000 },
    isContactless: { type: Boolean, default: true },
    isVirtual: { type: Boolean, default: false },
    frozenAt: Date,
    replacedBy: String,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BankCard = mongoose.model<IBankCard>('BankCard', bankCardSchema);
