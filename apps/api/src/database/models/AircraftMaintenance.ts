import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftMaintenance extends Document {
  maintenanceId: string;
  aircraftId: string;
  type: string;
  title: string;
  description: string;
  cost: number;
  flightHours: number;
  mechanicUserId?: Types.ObjectId;
  airportId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  requestedBy: Types.ObjectId;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftMaintenanceSchema = new Schema<IAircraftMaintenance>(
  {
    maintenanceId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
    type: { type: String, default: 'service' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    flightHours: { type: Number, default: 0 },
    mechanicUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    airportId: { type: String, index: true },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled', index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AircraftMaintenance = mongoose.model<IAircraftMaintenance>('AircraftMaintenance', aircraftMaintenanceSchema);
