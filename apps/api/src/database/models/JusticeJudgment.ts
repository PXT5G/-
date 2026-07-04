import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeJudgment extends Document {
  judgmentId: string;
  caseId: string;
  caseNumber: string;
  title: string;
  ruling: string;
  outcome: 'guilty' | 'not_guilty' | 'dismissed' | 'settled' | 'default';
  judgeEmployeeId: string;
  signatureHash: string;
  issuedAt: Date;
  effectiveAt: Date;
  sentenceId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceJudgmentSchema = new Schema<IJusticeJudgment>(
  {
    judgmentId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    title: { type: String, required: true },
    ruling: { type: String, required: true },
    outcome: { type: String, enum: ['guilty', 'not_guilty', 'dismissed', 'settled', 'default'], required: true },
    judgeEmployeeId: { type: String, required: true, index: true },
    signatureHash: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    effectiveAt: { type: Date, default: Date.now },
    sentenceId: { type: String, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeJudgment = mongoose.model<IJusticeJudgment>('JusticeJudgment', justiceJudgmentSchema);
