import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IVehicleInspection extends Document {
  inspectionId: string;
  vehicleId: string;
  type: 'safety' | 'emissions' | 'pre_sale' | 'annual' | 'government';
  inspectorUserId: Types.ObjectId;
  status: 'scheduled' | 'in_progress' | 'passed' | 'failed';
  scheduledAt: Date;
  completedAt?: Date;
  score?: number;
  findings: string;
  mileageAtInspection: number;
  reportUrl?: string;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const vehicleInspectionSchema = new Schema<IVehicleInspection>(
  {
    inspectionId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },
    type: { type: String, enum: ['safety', 'emissions', 'pre_sale', 'annual', 'government'], required: true },
    inspectorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['scheduled', 'in_progress', 'passed', 'failed'], default: 'scheduled', index: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    score: { type: Number, min: 0, max: 100 },
    findings: { type: String, default: '' },
    mileageAtInspection: { type: Number, default: 0 },
    reportUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const VehicleInspection = mongoose.model<IVehicleInspection>('VehicleInspection', vehicleInspectionSchema);
