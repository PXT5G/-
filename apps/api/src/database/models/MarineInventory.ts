import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineInventory extends Document {
  inventoryId: string;
  dealerId: string;
  companyId: string;
  vesselId: string;
  acquisitionCost: number;
  listPrice: number;
  status: 'in_stock' | 'reserved' | 'sold' | 'in_auction' | 'in_transit' | 'leased';
  reservedBy?: mongoose.Types.ObjectId;
  reservedUntil?: Date;
  acquiredAt: Date;
  soldAt?: Date;
  daysInStock: number;
  marinaId?: string;
  dockId?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const marineInventorySchema = new Schema<IMarineInventory>(
  {
    inventoryId: { type: String, required: true, unique: true, index: true },
    dealerId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    vesselId: { type: String, required: true, unique: true, index: true },
    acquisitionCost: { type: Number, required: true, min: 0 },
    listPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['in_stock', 'reserved', 'sold', 'in_auction', 'in_transit', 'leased'], default: 'in_stock', index: true },
    reservedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reservedUntil: { type: Date },
    acquiredAt: { type: Date, default: Date.now },
    soldAt: { type: Date },
    daysInStock: { type: Number, default: 0 },
    marinaId: { type: String, index: true },
    dockId: { type: String, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const MarineInventory = mongoose.model<IMarineInventory>('MarineInventory', marineInventorySchema);
