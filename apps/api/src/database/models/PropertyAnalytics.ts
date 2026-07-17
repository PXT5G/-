import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyAnalytics extends Document {
  analyticsId: string;
  propertyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  companyId?: string;
  period: string;
  totalAssets: number;
  marketValue: number;
  rentalIncome: number;
  monthlyRevenue: number;
  maintenanceCost: number;
  occupancyRate: number;
  profit: number;
  loss: number;
  roi: number;
  capitalGain: number;
  appreciation: number;
  propertyCount: number;
  listedCount: number;
  soldCount: number;
  rentedCount: number;
  computedAt: Date;
}

const propertyAnalyticsSchema = new Schema<IPropertyAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    companyId: { type: String, index: true },
    period: { type: String, required: true, index: true },
    totalAssets: { type: Number, default: 0 },
    marketValue: { type: Number, default: 0 },
    rentalIncome: { type: Number, default: 0 },
    monthlyRevenue: { type: Number, default: 0 },
    maintenanceCost: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    loss: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    capitalGain: { type: Number, default: 0 },
    appreciation: { type: Number, default: 0 },
    propertyCount: { type: Number, default: 0 },
    listedCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    rentedCount: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PropertyAnalytics = mongoose.model<IPropertyAnalytics>('PropertyAnalytics', propertyAnalyticsSchema);
