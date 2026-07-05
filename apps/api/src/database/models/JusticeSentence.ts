import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { SentenceType } from '../../constants/justice';

export interface IJusticeSentence extends Document {
  sentenceId: string;
  caseId: string;
  caseNumber: string;
  defendantName: string;
  defendantUserId?: Types.ObjectId;
  sentenceType: SentenceType;
  fineAmount: number;
  prisonDays: number;
  communityServiceHours: number;
  probationMonths: number;
  licenseSuspended: boolean;
  licenseSuspensionDays: number;
  description: string;
  issuedByEmployeeId: string;
  judgeEmployeeId: string;
  signatureHash: string;
  effectiveAt: Date;
  status: 'pending' | 'active' | 'completed' | 'appealed' | 'vacated';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceSentenceSchema = new Schema<IJusticeSentence>(
  {
    sentenceId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    defendantName: { type: String, required: true, index: true },
    defendantUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sentenceType: { type: String, enum: ['fine', 'prison', 'probation', 'community_service', 'license_suspension', 'combined'], required: true },
    fineAmount: { type: Number, default: 0 },
    prisonDays: { type: Number, default: 0 },
    communityServiceHours: { type: Number, default: 0 },
    probationMonths: { type: Number, default: 0 },
    licenseSuspended: { type: Boolean, default: false },
    licenseSuspensionDays: { type: Number, default: 0 },
    description: { type: String, required: true },
    issuedByEmployeeId: { type: String, required: true },
    judgeEmployeeId: { type: String, required: true },
    signatureHash: { type: String, required: true },
    effectiveAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'active', 'completed', 'appealed', 'vacated'], default: 'pending', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeSentence = mongoose.model<IJusticeSentence>('JusticeSentence', justiceSentenceSchema);
