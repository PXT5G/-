import mongoose, { Schema, Document } from 'mongoose';

export interface IGDPHistory extends Document {
  historyId: string;
  period: string;
  gdp: number;
  previousGdp: number;
  growth: number;
  revenueTotal: number;
  transactionVolume: number;
  governmentContracts: number;
  sectorContributions: Record<string, number>;
  recordedAt: Date;
}

const gdpHistorySchema = new Schema<IGDPHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    period: { type: String, required: true, index: true },
    gdp: { type: Number, default: 0 },
    previousGdp: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
    revenueTotal: { type: Number, default: 0 },
    transactionVolume: { type: Number, default: 0 },
    governmentContracts: { type: Number, default: 0 },
    sectorContributions: { type: Schema.Types.Mixed, default: {} },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GDPHistory = mongoose.model<IGDPHistory>('GDPHistory', gdpHistorySchema);
