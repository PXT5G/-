import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyAsset extends Document {
  assetId: string;
  companyId: string;
  branchId?: string;
  name: string;
  category: string;
  purchaseCost: number;
  currentValue: number;
  depreciationRate: number;
  serialNumber?: string;
  status: 'active' | 'disposed' | 'maintenance';
  acquiredAt: Date;
  disposedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyAssetSchema = new Schema<ICompanyAsset>(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    purchaseCost: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    depreciationRate: { type: Number, default: 10, min: 0, max: 100 },
    serialNumber: { type: String, index: true },
    status: { type: String, enum: ['active', 'disposed', 'maintenance'], default: 'active', index: true },
    acquiredAt: { type: Date, default: Date.now },
    disposedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const CompanyAsset = mongoose.model<ICompanyAsset>('CompanyAsset', companyAssetSchema);
