import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeDocument extends Document {
  documentId: string;
  title: string;
  type: 'order' | 'ruling' | 'motion' | 'brief' | 'transcript' | 'notice' | 'other';
  caseId?: string;
  content: string;
  filedByOfficialId: Types.ObjectId;
  filedByName?: string;
  status: 'draft' | 'filed' | 'sealed';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceDocumentSchema = new Schema<IJusticeDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['order', 'ruling', 'motion', 'brief', 'transcript', 'notice', 'other'], default: 'order' },
    caseId: { type: String, index: true },
    content: { type: String, required: true },
    filedByOfficialId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filedByName: { type: String },
    status: { type: String, enum: ['draft', 'filed', 'sealed'], default: 'filed', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeDocument = mongoose.model<IJusticeDocument>('JusticeDocument', justiceDocumentSchema);
