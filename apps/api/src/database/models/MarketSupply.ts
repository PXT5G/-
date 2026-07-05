import mongoose, { Schema, Document } from 'mongoose';
import type { EconomySector } from '../../constants/economy';

export interface IMarketSupply extends Document {
  supplyId: string;
  sector: EconomySector | string;
  period: string;
  index: number;
  change: number;
  listingCount: number;
  totalValue: number;
  averagePrice: number;
  computedAt: Date;
}

const marketSupplySchema = new Schema<IMarketSupply>(
  {
    supplyId: { type: String, required: true, unique: true, index: true },
    sector: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    index: { type: Number, default: 1 },
    change: { type: Number, default: 0 },
    listingCount: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    averagePrice: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketSupplySchema.index({ sector: 1, period: 1 }, { unique: true });

export const MarketSupply = mongoose.model<IMarketSupply>('MarketSupply', marketSupplySchema);
