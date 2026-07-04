import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyAnalytics extends Document {
  analyticsId: string;
  companyId: string;
  period: string;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  profit: number;
  loss: number;
  growth: number;
  expenses: number;
  payroll: number;
  topProducts: { productId: string; name: string; revenue: number; units: number }[];
  topEmployees: { employeeId: string; name: string; revenue: number }[];
  customerCount: number;
  salesChart: { date: string; revenue: number; expenses: number }[];
  financialChart: { month: string; income: number; expenses: number; profit: number }[];
  performanceReport: Record<string, unknown>;
  computedAt: Date;
}

const companyAnalyticsSchema = new Schema<ICompanyAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    dailyRevenue: { type: Number, default: 0 },
    weeklyRevenue: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    yearlyRevenue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    loss: { type: Number, default: 0 },
    growth: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    payroll: { type: Number, default: 0 },
    topProducts: {
      type: [{ productId: String, name: String, revenue: Number, units: Number }],
      default: [],
    },
    topEmployees: {
      type: [{ employeeId: String, name: String, revenue: Number }],
      default: [],
    },
    customerCount: { type: Number, default: 0 },
    salesChart: {
      type: [{ date: String, revenue: Number, expenses: Number }],
      default: [],
    },
    financialChart: {
      type: [{ month: String, income: Number, expenses: Number, profit: Number }],
      default: [],
    },
    performanceReport: { type: Schema.Types.Mixed, default: {} },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

companyAnalyticsSchema.index({ companyId: 1, period: 1 }, { unique: true });

export const CompanyAnalytics = mongoose.model<ICompanyAnalytics>('CompanyAnalytics', companyAnalyticsSchema);
