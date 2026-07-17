import mongoose, { Schema, Document } from 'mongoose';

export interface IEconomicReport extends Document {
  reportId: string;
  period: string;
  type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  summary: string;
  gdp: number;
  gdpGrowth: number;
  inflationRate: number;
  marketConfidence: number;
  consumerSpending: number;
  businessGrowthRate: number;
  businessFailureRate: number;
  liquidity: number;
  topCompanies: { companyId: string; name: string; valuation: number; rank: number }[];
  sectorBreakdown: Record<string, { demand: number; supply: number; priceIndex: number }>;
  bankSummary: Record<string, number>;
  highlights: string[];
  generatedAt: Date;
}

const economicReportSchema = new Schema<IEconomicReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    period: { type: String, required: true, index: true },
    type: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'hourly' },
    summary: { type: String, default: '' },
    gdp: { type: Number, default: 0 },
    gdpGrowth: { type: Number, default: 0 },
    inflationRate: { type: Number, default: 0 },
    marketConfidence: { type: Number, default: 0.5 },
    consumerSpending: { type: Number, default: 0 },
    businessGrowthRate: { type: Number, default: 0 },
    businessFailureRate: { type: Number, default: 0 },
    liquidity: { type: Number, default: 0 },
    topCompanies: {
      type: [{ companyId: String, name: String, valuation: Number, rank: Number }],
      default: [],
    },
    sectorBreakdown: { type: Schema.Types.Mixed, default: {} },
    bankSummary: { type: Schema.Types.Mixed, default: {} },
    highlights: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

economicReportSchema.index({ period: 1, type: 1 });

export const EconomicReport = mongoose.model<IEconomicReport>('EconomicReport', economicReportSchema);
