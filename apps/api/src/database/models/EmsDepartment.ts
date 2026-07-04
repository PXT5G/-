import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsDepartment extends Document {
  departmentId: string;
  hospitalId: string;
  name: string;
  type: 'er' | 'icu' | 'surgery' | 'pharmacy' | 'radiology' | 'pediatrics' | 'maternity' | 'general';
  headDoctorBadge?: string;
  headNurseBadge?: string;
  bedCount: number;
  occupiedBeds: number;
  waitingQueue: number;
  status: 'open' | 'full' | 'closed';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const emsDepartmentSchema = new Schema<IEmsDepartment>(
  {
    departmentId: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['er', 'icu', 'surgery', 'pharmacy', 'radiology', 'pediatrics', 'maternity', 'general'], required: true },
    headDoctorBadge: { type: String },
    headNurseBadge: { type: String },
    bedCount: { type: Number, default: 10 },
    occupiedBeds: { type: Number, default: 0 },
    waitingQueue: { type: Number, default: 0, index: true },
    status: { type: String, enum: ['open', 'full', 'closed'], default: 'open', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsDepartment = mongoose.model<IEmsDepartment>('EmsDepartment', emsDepartmentSchema);
