import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketEvent extends Document {
  eventId: string;
  type: string;
  title: string;
  description: string;
  ticker?: string;
  stockId?: string;
  impact: number;
  startsAt: Date;
  endsAt?: Date;
  active: boolean;
}

const marketEventSchema = new Schema<IMarketEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    ticker: { type: String, index: true },
    stockId: { type: String, index: true },
    impact: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const MarketEvent = mongoose.model<IMarketEvent>('MarketEvent', marketEventSchema);
