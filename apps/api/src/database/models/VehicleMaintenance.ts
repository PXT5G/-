import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleMaintenance extends Document {
  maintenanceId: string;
  vehicleId: string;
  type: 'service' | 'repair' | 'modification' | 'recall';
  title: string;
  description: string;
  cost: number;
  mileage: number;
  performedBy?: string;
  performedAt: Date;
  status: 'scheduled' | 'in_progress' | 'completed';
  requestedBy: Types.ObjectId;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleMaintenanceSchema = new Schema<IVehicleMaintenance>(
  {
    maintenanceId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    type: { type: String, enum: ['service', 'repair', 'modification', 'recall'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    mileage: { type: Number, default: 0 },
    performedBy: { type: String },
    performedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed'], default: 'completed' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VehicleMaintenance = mongoose.model<IVehicleMaintenance>('VehicleMaintenance', vehicleMaintenanceSchema);
