import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { TreatmentType } from '../../constants/ems';

export interface IEmsTreatment extends Document {
  treatmentId: string;
  patientId: string;
  recordId?: string;
  dispatchId?: string;
  treatmentType: TreatmentType;
  description: string;
  medication?: string;
  dosage?: string;
  administeredByBadge: string;
  administeredAt: Date;
  outcome?: string;
  signatureHash?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsTreatmentSchema = new Schema<IEmsTreatment>(
  {
    treatmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordId: { type: String, index: true },
    dispatchId: { type: String, index: true },
    treatmentType: { type: String, enum: ['first_aid', 'medication', 'procedure', 'surgery', 'observation', 'therapy'], required: true },
    description: { type: String, required: true },
    medication: { type: String },
    dosage: { type: String },
    administeredByBadge: { type: String, required: true },
    administeredAt: { type: Date, default: Date.now },
    outcome: { type: String },
    signatureHash: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsTreatment = mongoose.model<IEmsTreatment>('EmsTreatment', emsTreatmentSchema);
