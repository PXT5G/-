import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleAnalytics extends Document {
  analyticsId: string;
  dealerId?: string;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  period: string;
  totalInventory: number;
  inventoryValue: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  unitsSold: number;
  unitsListed: number;
  averageSalePrice: number;
  bestSellers: { vehicleId: string; brand: string; model: string; unitsSold: number; revenue: number }[];
  salesHistory: { month: string; units: number; revenue: number }[];
  commissionTotal: number;
  taxesPaid: number;
  computedAt: Date;
}

const vehicleAnalyticsSchema = new Schema<IVehicleAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    dealerId: { type: String, index: true },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    period: { type: String, required: true, index: true },
    totalInventory: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    unitsListed: { type: Number, default: 0 },
    averageSalePrice: { type: Number, default: 0 },
    bestSellers: { type: [{ vehicleId: String, brand: String, model: String, unitsSold: Number, revenue: Number }], default: [] },
    salesHistory: { type: [{ month: String, units: Number, revenue: Number }], default: [] },
    commissionTotal: { type: Number, default: 0 },
    taxesPaid: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const VehicleAnalytics = mongoose.model<IVehicleAnalytics>('VehicleAnalytics', vehicleAnalyticsSchema);
