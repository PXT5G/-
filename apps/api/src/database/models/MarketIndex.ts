import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketIndex extends Document {
  indexId: string;
  name: string;
  shortName: string;
  exchangeId: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  constituents: { stockId: string; ticker: string; weight: number }[];
  sector?: string;
  computedAt: Date;
}

const marketIndexSchema = new Schema<IMarketIndex>(
  {
    indexId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    exchangeId: { type: String, required: true, index: true },
    value: { type: Number, default: 1000 },
    previousValue: { type: Number, default: 1000 },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    constituents: { type: [{ stockId: String, ticker: String, weight: Number }], default: [] },
    sector: { type: String, index: true },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MarketIndex = mongoose.model<IMarketIndex>('MarketIndex', marketIndexSchema);
