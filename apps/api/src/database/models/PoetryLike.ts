import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryLike extends Document {
  poemId: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const poetryLikeSchema = new Schema<IPoetryLike>(
  {
    poemId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

poetryLikeSchema.index({ poemId: 1, userId: 1 }, { unique: true });

export const PoetryLike = mongoose.model<IPoetryLike>('PoetryLike', poetryLikeSchema);
