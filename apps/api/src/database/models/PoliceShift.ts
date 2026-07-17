import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceShift extends Document {
  shiftId: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  shiftType: 'patrol' | 'dispatch' | 'detective' | 'traffic' | 'swat' | 'admin';
  startAt: Date;
  endAt: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  district?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeShiftSchema = new Schema<IPoliceShift>(
  {
    shiftId: { type: String, required: true, unique: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true, index: true },
    shiftType: { type: String, enum: ['patrol', 'dispatch', 'detective', 'traffic', 'swat', 'admin'], default: 'patrol' },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    actualStartAt: { type: Date },
    actualEndAt: { type: Date },
    status: { type: String, enum: ['scheduled', 'active', 'completed', 'missed'], default: 'scheduled', index: true },
    district: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceShift = mongoose.model<IPoliceShift>('PoliceShift', policeShiftSchema);
