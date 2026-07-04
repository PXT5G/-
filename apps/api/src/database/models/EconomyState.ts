import mongoose, { Schema, Document } from 'mongoose';

export interface IEconomyState extends Document {
  stateId: string;
  period: string;
  gdp: number;
  gdpGrowth: number;
  inflationRate: number;
  deflationRate: number;
  marketConfidence: number;
  consumerSpending: number;
  businessGrowthRate: number;
  businessFailureRate: number;
  liquidity: number;
  totalMoneySupply: number;
  totalAssetValue: number;
  totalCompanyValuation: number;
  population: number;
  activeCompanies: number;
  activeListings: number;
  bankMetrics: {
    totalLoans: number;
    totalMortgages: number;
    totalFinancing: number;
    totalInterest: number;
    activeInstallments: number;
    latePayments: number;
    defaults: number;
  };
  sectorIndices: Record<string, number>;
  lastTickAt: Date;
  tickCount: number;
  computedAt: Date;
}

const economyStateSchema = new Schema<IEconomyState>(
  {
    stateId: { type: String, required: true, unique: true, index: true },
    period: { type: String, required: true, index: true },
    gdp: { type: Number, default: 0 },
    gdpGrowth: { type: Number, default: 0 },
    inflationRate: { type: Number, default: 0 },
    deflationRate: { type: Number, default: 0 },
    marketConfidence: { type: Number, default: 0.5, min: 0, max: 1 },
    consumerSpending: { type: Number, default: 0 },
    businessGrowthRate: { type: Number, default: 0 },
    businessFailureRate: { type: Number, default: 0 },
    liquidity: { type: Number, default: 0 },
    totalMoneySupply: { type: Number, default: 0 },
    totalAssetValue: { type: Number, default: 0 },
    totalCompanyValuation: { type: Number, default: 0 },
    population: { type: Number, default: 0 },
    activeCompanies: { type: Number, default: 0 },
    activeListings: { type: Number, default: 0 },
    bankMetrics: {
      type: {
        totalLoans: Number,
        totalMortgages: Number,
        totalFinancing: Number,
        totalInterest: Number,
        activeInstallments: Number,
        latePayments: Number,
        defaults: Number,
      },
      default: {},
    },
    sectorIndices: { type: Schema.Types.Mixed, default: {} },
    lastTickAt: { type: Date },
    tickCount: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EconomyState = mongoose.model<IEconomyState>('EconomyState', economyStateSchema);
