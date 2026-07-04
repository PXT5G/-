import mongoose, { Schema, Document, Types } from 'mongoose';

export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'closed';

export interface IPoliceReport extends Document {
  reportNumber: string;
  officerId: Types.ObjectId;
  userId: Types.ObjectId;
  caseId?: Types.ObjectId;
  type: string;
  title: string;
  description: string;
  location: string;
  involvedParties: string[];
  evidenceIds: Types.ObjectId[];
  status: ReportStatus;
  reviewNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policeReportSchema = new Schema<IPoliceReport>(
  {
    reportNumber: { type: String, required: true, unique: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caseId: { type: Schema.Types.ObjectId, ref: 'PoliceCase' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    involvedParties: [{ type: String }],
    evidenceIds: [{ type: Schema.Types.ObjectId, ref: 'PoliceEvidence' }],
    status: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed'], default: 'draft', index: true },
    reviewNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PoliceReport = mongoose.model<IPoliceReport>('PoliceReport', policeReportSchema);

export function generateReportNumber(): string {
  return `RPT-${Date.now().toString(36).toUpperCase()}`;
}
