import mongoose, { Schema, Document } from 'mongoose';

type DividendType = 'quarterly' | 'special' | 'annual';

export interface IDividend extends Document {
  dividendId: string;
  companyId: string;
  stockId: string;
  ticker: string;
  type: DividendType;
  amountPerShare: number;
  totalDistributed: number;
  recordDate: Date;
  paymentDate: Date;
  status: 'announced' | 'paid' | 'cancelled';
  recipients: { userId: string; shares: number; amount: number; paidAt?: Date }[];
}

const dividendSchema = new Schema<IDividend>(
  {
    dividendId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true },
    type: { type: String, enum: ['quarterly', 'special', 'annual'], default: 'quarterly' },
    amountPerShare: { type: Number, required: true },
    totalDistributed: { type: Number, default: 0 },
    recordDate: { type: Date, required: true },
    paymentDate: { type: Date, required: true },
    status: { type: String, enum: ['announced', 'paid', 'cancelled'], default: 'announced', index: true },
    recipients: { type: [{ userId: String, shares: Number, amount: Number, paidAt: Date }], default: [] },
  },
  { timestamps: true }
);

export const Dividend = mongoose.model<IDividend>('Dividend', dividendSchema);
