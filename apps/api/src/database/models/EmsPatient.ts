import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PatientStatus, BloodType } from '../../constants/ems';

export interface IEmsPatient extends Document {
  patientId: string;
  userId?: Types.ObjectId;
  name: string;
  dateOfBirth?: Date;
  bloodType: BloodType;
  allergies: string[];
  conditions: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyId?: string;
  status: PatientStatus;
  currentDispatchId?: string;
  currentHospitalId?: string;
  currentAdmissionId?: string;
  lastTreatmentAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsPatientSchema = new Schema<IEmsPatient>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, index: true },
    dateOfBirth: { type: Date },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], default: 'unknown' },
    allergies: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    insuranceProvider: { type: String },
    insurancePolicyId: { type: String },
    status: { type: String, enum: ['stable', 'critical', 'serious', 'deceased', 'discharged', 'admitted'], default: 'stable', index: true },
    currentDispatchId: { type: String, index: true },
    currentHospitalId: { type: String, index: true },
    currentAdmissionId: { type: String, index: true },
    lastTreatmentAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsPatient = mongoose.model<IEmsPatient>('EmsPatient', emsPatientSchema);
