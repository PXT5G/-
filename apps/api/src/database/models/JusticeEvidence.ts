import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { EvidenceType } from '../../constants/justice';

export interface IJusticeEvidence extends Document {
  evidenceId: string;
  caseId?: string;
  caseNumber?: string;
  policeEvidenceId?: string;
  title: string;
  description: string;
  type: EvidenceType;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  chainOfCustody: { officialId: Types.ObjectId; employeeId: string; action: string; at: Date; signatureHash?: string }[];
  collectedByEmployeeId: Types.ObjectId;
  collectedByEmployeeNumber: string;
  admitted: boolean;
  admittedAt?: Date;
  admittedByEmployeeId?: string;
  location?: string;
  district?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceEvidenceSchema = new Schema<IJusticeEvidence>(
  {
    evidenceId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, index: true },
    caseNumber: { type: String, index: true },
    policeEvidenceId: { type: String, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'audio', 'file', 'document', 'gps', 'phone_record', 'communication_log', 'digital'], required: true },
    fileUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
    chainOfCustody: [{
      officialId: { type: Schema.Types.ObjectId, ref: 'User' },
      employeeId: { type: String },
      action: { type: String },
      at: { type: Date },
      signatureHash: { type: String },
    }],
    collectedByEmployeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectedByEmployeeNumber: { type: String, required: true },
    admitted: { type: Boolean, default: false, index: true },
    admittedAt: { type: Date },
    admittedByEmployeeId: { type: String },
    location: { type: String },
    district: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeEvidence = mongoose.model<IJusticeEvidence>('JusticeEvidence', justiceEvidenceSchema);
