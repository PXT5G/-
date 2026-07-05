import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftInspection extends Document {
  inspectionId: string;
  aircraftId: string;
  type: string;
  inspectorUserId: Types.ObjectId;
  scheduledAt: Date;
  completedAt?: Date;
  flightHoursAtInspection: number;
  findings: string;
  passed: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftInspectionSchema = new Schema<IAircraftInspection>(
  {
    inspectionId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
    type: { type: String, default: 'annual' },
    inspectorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    flightHoursAtInspection: { type: Number, default: 0 },
    findings: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'failed'], default: 'scheduled', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AircraftInspection = mongoose.model<IAircraftInspection>('AircraftInspection', aircraftInspectionSchema);
