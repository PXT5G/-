import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { AppealStatus } from '../../constants/justice';

export interface IJusticeAppeal extends Document {
  appealId: string;
  caseId: string;
  caseNumber: string;
  originalSentenceId?: string;
  appellantName: string;
  appellantUserId?: Types.ObjectId;
  grounds: string;
  status: AppealStatus;
  filedByEmployeeId: string;
  assignedJudgeEmployeeId?: string;
  hearingId?: string;
  decision?: string;
  decisionAt?: Date;
  signatureHash?: string;
  filedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceAppealSchema = new Schema<IJusticeAppeal>(
  {
    appealId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    originalSentenceId: { type: String, index: true },
    appellantName: { type: String, required: true, index: true },
    appellantUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    grounds: { type: String, required: true },
    status: { type: String, enum: ['filed', 'under_review', 'hearing_scheduled', 'granted', 'denied', 'withdrawn'], default: 'filed', index: true },
    filedByEmployeeId: { type: String, required: true },
    assignedJudgeEmployeeId: { type: String, index: true },
    hearingId: { type: String },
    decision: { type: String },
    decisionAt: { type: Date },
    signatureHash: { type: String },
    filedAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeAppeal = mongoose.model<IJusticeAppeal>('JusticeAppeal', justiceAppealSchema);
