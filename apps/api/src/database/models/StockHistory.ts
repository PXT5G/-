import mongoose, { Schema, Document } from 'mongoose';

export interface IStockHistory extends Document {
  historyId: string;
  stockId: string;
  ticker: string;
  period: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: '1m' | '5m' | '1h' | '1d';
  recordedAt: Date;
}

const stockHistorySchema = new Schema<IStockHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, default: 0 },
    interval: { type: String, enum: ['1m', '5m', '1h', '1d'], default: '1h', index: true },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

stockHistorySchema.index({ stockId: 1, interval: 1, recordedAt: -1 });

export const StockHistory = mongoose.model<IStockHistory>('StockHistory', stockHistorySchema);
