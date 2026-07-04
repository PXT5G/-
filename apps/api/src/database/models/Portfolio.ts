import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPortfolio extends Document {
  portfolioId: string;
  userId: Types.ObjectId;
  cashBalance: number;
  portfolioValue: number;
  unrealizedProfit: number;
  realizedProfit: number;
  dailyGain: number;
  monthlyGain: number;
  dividendIncome: number;
  iban: string;
  walletId: string;
  totalInvested: number;
  lastUpdatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const portfolioSchema = new Schema<IPortfolio>(
  {
    portfolioId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    cashBalance: { type: Number, default: 100_000 },
    portfolioValue: { type: Number, default: 0 },
    unrealizedProfit: { type: Number, default: 0 },
    realizedProfit: { type: Number, default: 0 },
    dailyGain: { type: Number, default: 0 },
    monthlyGain: { type: Number, default: 0 },
    dividendIncome: { type: Number, default: 0 },
    iban: { type: String, required: true, index: true },
    walletId: { type: String, required: true, index: true },
    totalInvested: { type: Number, default: 0 },
    lastUpdatedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', portfolioSchema);
