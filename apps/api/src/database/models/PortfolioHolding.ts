import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPortfolioHolding extends Document {
  holdingId: string;
  portfolioId: string;
  userId: Types.ObjectId;
  stockId: string;
  ticker: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedProfit: number;
  realizedProfit: number;
  dividendIncome: number;
  acquiredAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const portfolioHoldingSchema = new Schema<IPortfolioHolding>(
  {
    holdingId: { type: String, required: true, unique: true, index: true },
    portfolioId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, index: true },
    shares: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0 },
    currentPrice: { type: Number, default: 0 },
    marketValue: { type: Number, default: 0 },
    unrealizedProfit: { type: Number, default: 0 },
    realizedProfit: { type: Number, default: 0 },
    dividendIncome: { type: Number, default: 0 },
    acquiredAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

portfolioHoldingSchema.index({ portfolioId: 1, stockId: 1 }, { unique: true });

export const PortfolioHolding = mongoose.model<IPortfolioHolding>('PortfolioHolding', portfolioHoldingSchema);
