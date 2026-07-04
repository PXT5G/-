import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface ICompanyInventory extends Document {
  inventoryId: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  purchaseCost: number;
  sellingPrice: number;
  serialNumbers: string[];
  supplierId?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  damageReports: { reportId: string; quantity: number; reason: string; reportedAt: Date }[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const companyInventorySchema = new Schema<ICompanyInventory>(
  {
    inventoryId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    warehouseId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 10 },
    purchaseCost: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    serialNumbers: { type: [String], default: [] },
    supplierId: { type: String, index: true },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
      default: 'in_stock',
      index: true,
    },
    damageReports: {
      type: [{ reportId: String, quantity: Number, reason: String, reportedAt: Date }],
      default: [],
    },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

companyInventorySchema.index({ companyId: 1, sku: 1 }, { unique: true });

export const CompanyInventory = mongoose.model<ICompanyInventory>('CompanyInventory', companyInventorySchema);
