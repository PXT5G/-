import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITrade extends Document {
  tradeId: string;
  orderId: string;
  userId: Types.ObjectId;
  stockId: string;
  ticker: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  fee: number;
  economyValuationId?: string;
  priceAtTrade: number;
  suspicious: boolean;
  fraudFlags: string[];
  executedAt: Date;
}

const tradeSchema = new Schema<ITrade>(
  {
    tradeId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, index: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    economyValuationId: { type: String },
    priceAtTrade: { type: Number },
    suspicious: { type: Boolean, default: false, index: true },
    fraudFlags: { type: [String], default: [] },
    executedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const Trade = mongoose.model<ITrade>('Trade', tradeSchema);
