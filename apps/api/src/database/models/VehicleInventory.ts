import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleInventory extends Document {
  inventoryId: string;
  dealerId: string;
  companyId: string;
  vehicleId: string;
  acquisitionCost: number;
  listPrice: number;
  status: 'in_stock' | 'reserved' | 'sold' | 'in_auction' | 'in_transit';
  reservedBy?: mongoose.Types.ObjectId;
  reservedUntil?: Date;
  acquiredAt: Date;
  soldAt?: Date;
  daysInStock: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleInventorySchema = new Schema<IVehicleInventory>(
  {
    inventoryId: { type: String, required: true, unique: true, index: true },
    dealerId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true, unique: true, index: true },
    acquisitionCost: { type: Number, required: true, min: 0 },
    listPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['in_stock', 'reserved', 'sold', 'in_auction', 'in_transit'], default: 'in_stock', index: true },
    reservedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reservedUntil: { type: Date },
    acquiredAt: { type: Date, default: Date.now },
    soldAt: { type: Date },
    daysInStock: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const VehicleInventory = mongoose.model<IVehicleInventory>('VehicleInventory', vehicleInventorySchema);
