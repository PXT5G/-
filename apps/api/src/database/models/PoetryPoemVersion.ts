import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryPoemVersion extends Document {
  versionId: string;
  poemId: string;
  versionNumber: number;
  title: string;
  content: string;
  markdown: string;
  changeNote?: string;
  savedBy: Types.ObjectId;
  createdAt?: Date;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryPoemVersionSchema = new Schema<IPoetryPoemVersion>(
  {
    versionId: { type: String, required: true, unique: true, index: true },
    poemId: { type: String, required: true, index: true },
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    markdown: { type: String, default: '' },
    changeNote: { type: String },
    savedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

poetryPoemVersionSchema.index({ poemId: 1, versionNumber: -1 });

export const PoetryPoemVersion = mongoose.model<IPoetryPoemVersion>('PoetryPoemVersion', poetryPoemVersionSchema);
