import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceReport extends Document {
  reportId: string;
  reportType: 'incident' | 'crime' | 'arrest';
  title: string;
  description: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  location?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  involvedParties: string[];
  suspectNames: string[];
  evidenceIds: string[];
  status: 'draft' | 'filed' | 'under_review' | 'closed';
  caseId?: string;
  narrative?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeReportSchema = new Schema<IPoliceReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    reportType: { type: String, enum: ['incident', 'crime', 'arrest'], required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true },
    location: { type: String },
    district: { type: String, index: true },
    latitude: { type: Number },
    longitude: { type: Number },
    involvedParties: { type: [String], default: [] },
    suspectNames: { type: [String], default: [] },
    evidenceIds: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'filed', 'under_review', 'closed'], default: 'draft', index: true },
    caseId: { type: String, index: true },
    narrative: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceReport = mongoose.model<IPoliceReport>('PoliceReport', policeReportSchema);
