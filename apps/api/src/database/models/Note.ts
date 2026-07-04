import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface INote extends Document {
  userId: Types.ObjectId;
  noteId: string;
  title: string;
  content: string;
  folderId?: string;
  pinned: boolean;
  locked: boolean;
  checklist: Array<{ id: string; text: string; checked: boolean }>;
  images: string[];
  voiceNoteIds: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: String, required: true },
    title: { type: String, default: 'Untitled' },
    content: { type: String, default: '' },
    folderId: { type: String, index: true },
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    checklist: [{
      id: String,
      text: String,
      checked: { type: Boolean, default: false },
    }],
    images: { type: [String], default: [] },
    voiceNoteIds: { type: [String], default: [] },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, noteId: 1 }, { unique: true });
noteSchema.index({ userId: 1, title: 'text', content: 'text' });

export const Note = mongoose.model<INote>('Note', noteSchema);
