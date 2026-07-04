import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineMaintenance extends Document {
  maintenanceId: string;
  vesselId: string;
  type: string;
  title: string;
  description: string;
  cost: number;
  engineHours: number;
  mechanicUserId?: Types.ObjectId;
  marinaId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  requestedBy: Types.ObjectId;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const marineMaintenanceSchema = new Schema<IMarineMaintenance>(
  {
    maintenanceId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, required: true, index: true },
    type: { type: String, default: 'service' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    engineHours: { type: Number, default: 0 },
    mechanicUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    marinaId: { type: String, index: true },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled', index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MarineMaintenance = mongoose.model<IMarineMaintenance>('MarineMaintenance', marineMaintenanceSchema);
