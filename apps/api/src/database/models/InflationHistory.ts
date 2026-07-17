import mongoose, { Schema, Document } from 'mongoose';

export interface IInflationHistory extends Document {
  historyId: string;
  period: string;
  rate: number;
  priceIndex: number;
  previousIndex: number;
  change: number;
  sectorRates: Record<string, number>;
  recordedAt: Date;
}

const inflationHistorySchema = new Schema<IInflationHistory>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    period: { type: String, required: true, index: true },
    rate: { type: Number, default: 0 },
    priceIndex: { type: Number, default: 100 },
    previousIndex: { type: Number, default: 100 },
    change: { type: Number, default: 0 },
    sectorRates: { type: Schema.Types.Mixed, default: {} },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const InflationHistory = mongoose.model<IInflationHistory>('InflationHistory', inflationHistorySchema);
