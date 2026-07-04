import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeSubpoena extends Document {
  subpoenaId: string;
  caseId: string;
  caseNumber: string;
  recipientName: string;
  recipientUserId?: Types.ObjectId;
  recipientPhone?: string;
  recipientAddress?: string;
  documentType: 'testimony' | 'records' | 'physical_evidence' | 'appearance';
  description: string;
  dueDate: Date;
  issuedByEmployeeId: string;
  judgeEmployeeId: string;
  signatureHash: string;
  status: 'issued' | 'served' | 'complied' | 'contested' | 'quashed';
  servedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceSubpoenaSchema = new Schema<IJusticeSubpoena>(
  {
    subpoenaId: { type: String, required: true, unique: true, index: true },
    caseId: { type: String, required: true, index: true },
    caseNumber: { type: String, required: true, index: true },
    recipientName: { type: String, required: true, index: true },
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    recipientPhone: { type: String },
    recipientAddress: { type: String },
    documentType: { type: String, enum: ['testimony', 'records', 'physical_evidence', 'appearance'], required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    issuedByEmployeeId: { type: String, required: true },
    judgeEmployeeId: { type: String, required: true },
    signatureHash: { type: String, required: true },
    status: { type: String, enum: ['issued', 'served', 'complied', 'contested', 'quashed'], default: 'issued', index: true },
    servedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeSubpoena = mongoose.model<IJusticeSubpoena>('JusticeSubpoena', justiceSubpoenaSchema);
