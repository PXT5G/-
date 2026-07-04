import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryBookmark extends Document {
  poemId: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const poetryBookmarkSchema = new Schema<IPoetryBookmark>(
  {
    poemId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

poetryBookmarkSchema.index({ poemId: 1, userId: 1 }, { unique: true });

export const PoetryBookmark = mongoose.model<IPoetryBookmark>('PoetryBookmark', poetryBookmarkSchema);
