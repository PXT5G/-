import mongoose, { Schema, Document } from 'mongoose';

export interface IAssetValuation extends Document {
  valuationId: string;
  assetType: 'property' | 'vehicle' | 'aircraft' | 'vessel' | 'company_asset';
  assetId: string;
  companyId?: string;
  period: string;
  previousValue: number;
  currentValue: number;
  change: number;
  changePercent: number;
  demandFactor: number;
  inflationFactor: number;
  sector: string;
  computedAt: Date;
}

const assetValuationSchema = new Schema<IAssetValuation>(
  {
    valuationId: { type: String, required: true, unique: true, index: true },
    assetType: { type: String, enum: ['property', 'vehicle', 'aircraft', 'vessel', 'company_asset'], required: true, index: true },
    assetId: { type: String, required: true, index: true },
    companyId: { type: String, index: true },
    period: { type: String, required: true, index: true },
    previousValue: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    demandFactor: { type: Number, default: 0 },
    inflationFactor: { type: Number, default: 0 },
    sector: { type: String, index: true },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assetValuationSchema.index({ assetType: 1, assetId: 1, period: 1 }, { unique: true });

export const AssetValuation = mongoose.model<IAssetValuation>('AssetValuation', assetValuationSchema);
