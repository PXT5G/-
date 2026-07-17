import mongoose, { Schema, Document } from 'mongoose';

export interface IAircraftAnalytics extends Document {
  analyticsId: string;
  dealerId?: string;
  companyId?: string;
  ownerUserId?: mongoose.Types.ObjectId;
  period: string;
  fleetCount: number;
  fleetValue: number;
  totalInventory: number;
  inventoryValue: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  maintenanceCost: number;
  fuelCost: number;
  insuranceCost: number;
  unitsSold: number;
  unitsListed: number;
  averageSalePrice: number;
  bestSellers: { aircraftId: string; brand: string; model: string; unitsSold: number; revenue: number }[];
  salesHistory: { month: string; units: number; revenue: number }[];
  commissionTotal: number;
  taxesPaid: number;
  computedAt: Date;
}

const aircraftAnalyticsSchema = new Schema<IAircraftAnalytics>(
  {
    analyticsId: { type: String, required: true, unique: true, index: true },
    dealerId: { type: String, index: true },
    companyId: { type: String, index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    period: { type: String, required: true, index: true },
    fleetCount: { type: Number, default: 0 },
    fleetValue: { type: Number, default: 0 },
    totalInventory: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    maintenanceCost: { type: Number, default: 0 },
    fuelCost: { type: Number, default: 0 },
    insuranceCost: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    unitsListed: { type: Number, default: 0 },
    averageSalePrice: { type: Number, default: 0 },
    bestSellers: { type: [{ aircraftId: String, brand: String, model: String, unitsSold: Number, revenue: Number }], default: [] },
    salesHistory: { type: [{ month: String, units: Number, revenue: Number }], default: [] },
    commissionTotal: { type: Number, default: 0 },
    taxesPaid: { type: Number, default: 0 },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AircraftAnalytics = mongoose.model<IAircraftAnalytics>('AircraftAnalytics', aircraftAnalyticsSchema);
