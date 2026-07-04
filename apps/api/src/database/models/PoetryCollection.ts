import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryCollection extends Document {
  collectionId: string;
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  poemIds: string[];
  isPublic: boolean;
  coverImageUrl?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryCollectionSchema = new Schema<IPoetryCollection>(
  {
    collectionId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    poemIds: { type: [String], default: [] },
    isPublic: { type: Boolean, default: true, index: true },
    coverImageUrl: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryCollection = mongoose.model<IPoetryCollection>('PoetryCollection', poetryCollectionSchema);
