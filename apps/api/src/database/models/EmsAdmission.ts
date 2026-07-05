import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { AdmissionStatus } from '../../constants/ems';

export interface IEmsAdmission extends Document {
  admissionId: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  departmentId: string;
  bedId?: string;
  dispatchId?: string;
  admittingBadge: string;
  diagnosis: string;
  status: AdmissionStatus;
  admittedAt: Date;
  dischargedAt?: Date;
  dischargedByBadge?: string;
  dischargeNotes?: string;
  queuePosition?: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsAdmissionSchema = new Schema<IEmsAdmission>(
  {
    admissionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true, index: true },
    bedId: { type: String, index: true },
    dispatchId: { type: String, index: true },
    admittingBadge: { type: String, required: true },
    diagnosis: { type: String, required: true },
    status: { type: String, enum: ['pending', 'admitted', 'in_treatment', 'discharged', 'transferred'], default: 'pending', index: true },
    admittedAt: { type: Date, default: Date.now },
    dischargedAt: { type: Date },
    dischargedByBadge: { type: String },
    dischargeNotes: { type: String },
    queuePosition: { type: Number },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsAdmission = mongoose.model<IEmsAdmission>('EmsAdmission', emsAdmissionSchema);
