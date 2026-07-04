import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryComment extends Document {
  commentId: string;
  poemId: string;
  userId: Types.ObjectId;
  body: string;
  parentId?: string;
  likeCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryCommentSchema = new Schema<IPoetryComment>(
  {
    commentId: { type: String, required: true, unique: true, index: true },
    poemId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true },
    parentId: { type: String, index: true },
    likeCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryComment = mongoose.model<IPoetryComment>('PoetryComment', poetryCommentSchema);
