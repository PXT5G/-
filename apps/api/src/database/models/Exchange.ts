import mongoose, { Schema, Document } from 'mongoose';

export interface IExchange extends Document {
  exchangeId: string;
  name: string;
  shortName: string;
  currency: string;
  timezone: string;
  tradingHours: { open: string; close: string; timezone: string };
  status: 'open' | 'closed' | 'pre_market' | 'after_hours' | 'halted';
  totalMarketCap: number;
  totalVolume24h: number;
  listedCount: number;
  indexCount: number;
  lastPriceUpdateAt?: Date;
}

const exchangeSchema = new Schema<IExchange>(
  {
    exchangeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    currency: { type: String, default: 'GULF' },
    timezone: { type: String, default: 'Asia/Dubai' },
    tradingHours: {
      type: { open: String, close: String, timezone: String },
      default: { open: '09:00', close: '17:00', timezone: 'Asia/Dubai' },
    },
    status: { type: String, enum: ['open', 'closed', 'pre_market', 'after_hours', 'halted'], default: 'open', index: true },
    totalMarketCap: { type: Number, default: 0 },
    totalVolume24h: { type: Number, default: 0 },
    listedCount: { type: Number, default: 0 },
    indexCount: { type: Number, default: 0 },
    lastPriceUpdateAt: { type: Date },
  },
  { timestamps: true }
);

export const Exchange = mongoose.model<IExchange>('Exchange', exchangeSchema);
