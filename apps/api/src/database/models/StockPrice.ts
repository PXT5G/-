import mongoose, { Schema, Document } from 'mongoose';

export interface IStockPrice extends Document {
  priceId: string;
  stockId: string;
  ticker: string;
  price: number;
  economyBasePrice: number;
  orderBookImpact: number;
  demandImpact: number;
  confidenceImpact: number;
  economyValuationId: string;
  totalValuation: number;
  recordedAt: Date;
}

const stockPriceSchema = new Schema<IStockPrice>(
  {
    priceId: { type: String, required: true, unique: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    economyBasePrice: { type: Number, required: true },
    orderBookImpact: { type: Number, default: 0 },
    demandImpact: { type: Number, default: 0 },
    confidenceImpact: { type: Number, default: 0 },
    economyValuationId: { type: String, required: true },
    totalValuation: { type: Number, required: true },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

stockPriceSchema.index({ stockId: 1, recordedAt: -1 });

export const StockPrice = mongoose.model<IStockPrice>('StockPrice', stockPriceSchema);
