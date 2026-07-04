import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeDocket extends Document {
  docketId: string;
  date: Date;
  courtroomId: string;
  entries: {
    time: string;
    caseNumber: string;
    caseId: string;
    title: string;
    hearingId?: string;
    trialId?: string;
    judgeEmployeeId?: string;
    status: 'scheduled' | 'called' | 'completed' | 'continued';
  }[];
  publishedByEmployeeId: string;
  status: 'draft' | 'published' | 'archived';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceDocketSchema = new Schema<IJusticeDocket>(
  {
    docketId: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    courtroomId: { type: String, required: true, index: true },
    entries: [{
      time: { type: String, required: true },
      caseNumber: { type: String, required: true },
      caseId: { type: String, required: true },
      title: { type: String, required: true },
      hearingId: { type: String },
      trialId: { type: String },
      judgeEmployeeId: { type: String },
      status: { type: String, enum: ['scheduled', 'called', 'completed', 'continued'], default: 'scheduled' },
    }],
    publishedByEmployeeId: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeDocket = mongoose.model<IJusticeDocket>('JusticeDocket', justiceDocketSchema);
