import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyValuation extends Document {
  valuationId: string;
  companyId: string;
  companyName: string;
  period: string;
  totalValuation: number;
  cash: number;
  bankBalance: number;
  revenue: number;
  expenses: number;
  profit: number;
  employees: number;
  assets: number;
  vehicles: number;
  aircraft: number;
  marineFleet: number;
  properties: number;
  loans: number;
  debt: number;
  taxes: number;
  inventory: number;
  customers: number;
  businessRating: number;
  rank: number;
  components: Record<string, number>;
  computedAt: Date;
}

const companyValuationSchema = new Schema<ICompanyValuation>(
  {
    valuationId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    period: { type: String, required: true, index: true },
    totalValuation: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    bankBalance: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    employees: { type: Number, default: 0 },
    assets: { type: Number, default: 0 },
    vehicles: { type: Number, default: 0 },
    aircraft: { type: Number, default: 0 },
    marineFleet: { type: Number, default: 0 },
    properties: { type: Number, default: 0 },
    loans: { type: Number, default: 0 },
    debt: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    inventory: { type: Number, default: 0 },
    customers: { type: Number, default: 0 },
    businessRating: { type: Number, default: 3, min: 1, max: 5 },
    rank: { type: Number, default: 0 },
    components: { type: Schema.Types.Mixed, default: {} },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

companyValuationSchema.index({ companyId: 1, period: 1 }, { unique: true });
companyValuationSchema.index({ period: 1, totalValuation: -1 });

export const CompanyValuation = mongoose.model<ICompanyValuation>('CompanyValuation', companyValuationSchema);
