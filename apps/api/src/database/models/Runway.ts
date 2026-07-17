import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IRunway extends Document {
  runwayId: string;
  airportId: string;
  designation: string;
  length: number;
  width: number;
  surface: string;
  status: 'active' | 'closed' | 'under_maintenance';
  lightingType: string;
  createdBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const runwaySchema = new Schema<IRunway>(
  {
    runwayId: { type: String, required: true, unique: true, index: true },
    airportId: { type: String, required: true, index: true },
    designation: { type: String, required: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    surface: { type: String, enum: ['asphalt', 'concrete', 'grass', 'water', 'gravel'], default: 'asphalt' },
    status: { type: String, enum: ['active', 'closed', 'under_maintenance'], default: 'active', index: true },
    lightingType: { type: String, default: 'standard' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Runway = mongoose.model<IRunway>('Runway', runwaySchema);
