import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { BedStatus } from '../../constants/ems';

export interface IEmsBed extends Document {
  bedId: string;
  hospitalId: string;
  departmentId: string;
  roomNumber: string;
  bedNumber: string;
  status: BedStatus;
  patientId?: string;
  admissionId?: string;
  assignedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const emsBedSchema = new Schema<IEmsBed>(
  {
    bedId: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    bedNumber: { type: String, required: true },
    status: { type: String, enum: ['available', 'occupied', 'reserved', 'maintenance'], default: 'available', index: true },
    patientId: { type: String, index: true },
    admissionId: { type: String, index: true },
    assignedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsBed = mongoose.model<IEmsBed>('EmsBed', emsBedSchema);
