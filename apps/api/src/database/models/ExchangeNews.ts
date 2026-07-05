import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExchangeNews extends Document {
  newsId: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  ticker?: string;
  companyId?: string;
  stockId?: string;
  impact: number;
  source: string;
  publishedAt: Date;
  createdBy?: Types.ObjectId;
  isPublished: boolean;
}

const exchangeNewsSchema = new Schema<IExchangeNews>(
  {
    newsId: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    body: { type: String, default: '' },
    ticker: { type: String, index: true },
    companyId: { type: String, index: true },
    stockId: { type: String, index: true },
    impact: { type: Number, default: 0, min: -1, max: 1 },
    source: { type: String, default: 'GULF Exchange' },
    publishedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ExchangeNews = mongoose.model<IExchangeNews>('ExchangeNews', exchangeNewsSchema);
