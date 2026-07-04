import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceCase extends Document {
  caseId: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'pending_court' | 'closed';
  leadOfficerId: Types.ObjectId;
  leadBadge: string;
  assignedOfficerIds: Types.ObjectId[];
  suspectNames: string[];
  charges: string[];
  reportIds: string[];
  evidenceIds: string[];
  timeline: { at: Date; event: string; officerBadge?: string }[];
  district?: string;
  closedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeCaseSchema = new Schema<IPoliceCase>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'investigating', 'pending_court', 'closed'], default: 'open', index: true },
    leadOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leadBadge: { type: String, required: true },
    assignedOfficerIds: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    suspectNames: { type: [String], default: [] },
    charges: { type: [String], default: [] },
    reportIds: { type: [String], default: [] },
    evidenceIds: { type: [String], default: [] },
    timeline: [{
      at: { type: Date, required: true },
      event: { type: String, required: true },
      officerBadge: { type: String },
    }],
    district: { type: String },
    closedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceCase = mongoose.model<IPoliceCase>('PoliceCase', policeCaseSchema);
