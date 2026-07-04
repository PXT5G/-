import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMarineInspection extends Document {
  inspectionId: string;
  vesselId: string;
  type: string;
  inspectorUserId: Types.ObjectId;
  scheduledAt: Date;
  completedAt?: Date;
  engineHoursAtInspection: number;
  findings: string;
  passed: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const marineInspectionSchema = new Schema<IMarineInspection>(
  {
    inspectionId: { type: String, required: true, unique: true, index: true },
    vesselId: { type: String, required: true, index: true },
    type: { type: String, default: 'hull_survey' },
    inspectorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    engineHoursAtInspection: { type: Number, default: 0 },
    findings: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'failed'], default: 'scheduled', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MarineInspection = mongoose.model<IMarineInspection>('MarineInspection', marineInspectionSchema);
