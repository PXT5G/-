import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoliceNote extends Document {
  noteId: string;
  officerId: Types.ObjectId;
  officerBadge: string;
  subjectType: 'person' | 'vehicle' | 'case' | 'unit' | 'general';
  subjectId?: string;
  content: string;
  isInternal: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const policeNoteSchema = new Schema<IPoliceNote>(
  {
    noteId: { type: String, required: true, unique: true, index: true },
    officerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerBadge: { type: String, required: true },
    subjectType: { type: String, enum: ['person', 'vehicle', 'case', 'unit', 'general'], default: 'general' },
    subjectId: { type: String, index: true },
    content: { type: String, required: true },
    isInternal: { type: Boolean, default: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoliceNote = mongoose.model<IPoliceNote>('PoliceNote', policeNoteSchema);
