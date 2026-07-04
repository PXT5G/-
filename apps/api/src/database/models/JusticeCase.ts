import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { CaseStatus } from '../../constants/justice';

export interface IJusticeCase extends Document {
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  policeCaseId?: string;
  policeReportIds: string[];
  defendantName: string;
  defendantUserId?: Types.ObjectId;
  prosecutorEmployeeId?: string;
  defenseAttorneyEmployeeId?: string;
  judgeEmployeeId?: string;
  clerkEmployeeId?: string;
  charges: string[];
  chargeIds: string[];
  evidenceIds: string[];
  witnessIds: string[];
  hearingIds: string[];
  trialId?: string;
  appealIds: string[];
  courtroomId?: string;
  district?: string;
  filedAt: Date;
  closedAt?: Date;
  timeline: { at: Date; event: string; employeeId?: string; signatureHash?: string }[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceCaseSchema = new Schema<IJusticeCase>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    caseNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'arraignment', 'pretrial', 'trial', 'sentencing', 'appealed', 'closed', 'dismissed'], default: 'pending', index: true },
    policeCaseId: { type: String, index: true },
    policeReportIds: { type: [String], default: [] },
    defendantName: { type: String, required: true, index: true },
    defendantUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    prosecutorEmployeeId: { type: String, index: true },
    defenseAttorneyEmployeeId: { type: String, index: true },
    judgeEmployeeId: { type: String, index: true },
    clerkEmployeeId: { type: String, index: true },
    charges: { type: [String], default: [] },
    chargeIds: { type: [String], default: [] },
    evidenceIds: { type: [String], default: [] },
    witnessIds: { type: [String], default: [] },
    hearingIds: { type: [String], default: [] },
    trialId: { type: String, index: true },
    appealIds: { type: [String], default: [] },
    courtroomId: { type: String, index: true },
    district: { type: String },
    filedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    timeline: [{
      at: { type: Date, required: true },
      event: { type: String, required: true },
      employeeId: { type: String },
      signatureHash: { type: String },
    }],
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeCase = mongoose.model<IJusticeCase>('JusticeCase', justiceCaseSchema);
