import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceEvidence extends Document {
  evidenceId: string;
  caseId?: string;
  reportId?: string;
  title: string;
  description: string;
  type: 'photo' | 'video' | 'document' | 'physical' | 'digital' | 'bodycam';
  fileUrl?: string;
  lockerNumber?: string;
  chainOfCustody: { officerId: Types.ObjectId; badge: string; action: string; at: Date }[];
  collectedByOfficerId: Types.ObjectId;
  collectedByBadge: string;
  location?: string;
  district?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeEvidenceSchema = new Schema<IPoliceEvidence>(
  {
    evidenceId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, index: true },
    reportId: { type: String, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video', 'document', 'physical', 'digital', 'bodycam'], required: true },
    fileUrl: { type: String },
    lockerNumber: { type: String, index: true },
    chainOfCustody: [{
      officerId: { type: Schema.Types.ObjectId, ref: 'User' },
      badge: { type: String },
      action: { type: String },
      at: { type: Date },
    }],
    collectedByOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collectedByBadge: { type: String, required: true },
    location: { type: String },
    district: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceEvidence = mongoose.model<IPoliceEvidence>('PoliceEvidence', policeEvidenceSchema);
