import mongoose, { Schema, Document } from 'mongoose';
import type { EconomySector } from '../../constants/economy';

export interface IMarketDemand extends Document {
  demandId: string;
  sector: EconomySector | string;
  period: string;
  index: number;
  change: number;
  factors: {
    population: number;
    sales: number;
    supply: number;
    events: number;
    government: number;
    weather: number;
    economy: number;
  };
  computedAt: Date;
}

const marketDemandSchema = new Schema<IMarketDemand>(
  {
    demandId: { type: String, required: true, unique: true, index: true },
    sector: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    index: { type: Number, default: 1 },
    change: { type: Number, default: 0 },
    factors: {
      type: {
        population: Number,
        sales: Number,
        supply: Number,
        events: Number,
        government: Number,
        weather: Number,
        economy: Number,
      },
      default: {},
    },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

marketDemandSchema.index({ sector: 1, period: 1 }, { unique: true });

export const MarketDemand = mongoose.model<IMarketDemand>('MarketDemand', marketDemandSchema);
