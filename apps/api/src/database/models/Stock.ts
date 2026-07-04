import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { StockSector, TradingStatus } from '../../constants/exchange';

export interface IStock extends Document {
  stockId: string;
  ticker: string;
  listedCompanyId: string;
  companyId: string;
  exchangeId: string;
  name: string;
  sector: StockSector | string;
  currentPrice: number;
  openingPrice: number;
  closingPrice: number;
  high: number;
  low: number;
  marketCap: number;
  outstandingShares: number;
  availableShares: number;
  volume: number;
  volume24h: number;
  dividendYield: number;
  peRatio: number;
  bookValue: number;
  volatility: number;
  week52High: number;
  week52Low: number;
  marketConfidence: number;
  tradingStatus: TradingStatus;
  economyValuationId?: string;
  lastPriceUpdateAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const stockSchema = new Schema<IStock>(
  {
    stockId: { type: String, required: true, unique: true, index: true },
    ticker: { type: String, required: true, unique: true, index: true },
    listedCompanyId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    exchangeId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sector: { type: String, required: true, index: true },
    currentPrice: { type: Number, default: 0, index: true },
    openingPrice: { type: Number, default: 0 },
    closingPrice: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    marketCap: { type: Number, default: 0, index: true },
    outstandingShares: { type: Number, default: 1_000_000 },
    availableShares: { type: Number, default: 1_000_000 },
    volume: { type: Number, default: 0 },
    volume24h: { type: Number, default: 0, index: true },
    dividendYield: { type: Number, default: 0 },
    peRatio: { type: Number, default: 0 },
    bookValue: { type: Number, default: 0 },
    volatility: { type: Number, default: 0 },
    week52High: { type: Number, default: 0 },
    week52Low: { type: Number, default: 0 },
    marketConfidence: { type: Number, default: 0.5 },
    tradingStatus: { type: String, enum: ['active', 'halted', 'suspended', 'delisted', 'ipo_pending'], default: 'active', index: true },
    economyValuationId: { type: String, index: true },
    lastPriceUpdateAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Stock = mongoose.model<IStock>('Stock', stockSchema);
