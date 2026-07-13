import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IJusticeNote extends Document {
  noteId: string;
  officialId: Types.ObjectId;
  officialName?: string;
  content: string;
  subjectType: 'general' | 'case' | 'hearing' | 'appeal' | 'sentence';
  subjectId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const justiceNoteSchema = new Schema<IJusticeNote>(
  {
    noteId: { type: String, required: true, unique: true, index: true },
    officialId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officialName: { type: String },
    content: { type: String, required: true },
    subjectType: { type: String, enum: ['general', 'case', 'hearing', 'appeal', 'sentence'], default: 'general' },
    subjectId: { type: String, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const JusticeNote = mongoose.model<IJusticeNote>('JusticeNote', justiceNoteSchema);
