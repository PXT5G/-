import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IEmsNote extends Document {
  noteId: string;
  personnelId: Types.ObjectId;
  personnelName?: string;
  content: string;
  subjectType: 'general' | 'patient' | 'incident' | 'dispatch';
  subjectId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const emsNoteSchema = new Schema<IEmsNote>(
  {
    noteId: { type: String, required: true, unique: true, index: true },
    personnelId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personnelName: { type: String },
    content: { type: String, required: true },
    subjectType: { type: String, enum: ['general', 'patient', 'incident', 'dispatch'], default: 'general' },
    subjectId: { type: String, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const EmsNote = mongoose.model<IEmsNote>('EmsNote', emsNoteSchema);
