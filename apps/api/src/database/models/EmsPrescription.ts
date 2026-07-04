import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsPrescription extends Document {
  prescriptionId: string;
  patientId: string;
  recordId?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribedByBadge: string;
  prescribedAt: Date;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  pharmacyId?: string;
  signatureHash: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsPrescriptionSchema = new Schema<IEmsPrescription>(
  {
    prescriptionId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    recordId: { type: String, index: true },
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
    prescribedByBadge: { type: String, required: true },
    prescribedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'filled', 'cancelled', 'expired'], default: 'active', index: true },
    pharmacyId: { type: String },
    signatureHash: { type: String, required: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsPrescription = mongoose.model<IEmsPrescription>('EmsPrescription', emsPrescriptionSchema);
