import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryFavorite extends Document {
  poemId: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const poetryFavoriteSchema = new Schema<IPoetryFavorite>(
  {
    poemId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

poetryFavoriteSchema.index({ poemId: 1, userId: 1 }, { unique: true });

export const PoetryFavorite = mongoose.model<IPoetryFavorite>('PoetryFavorite', poetryFavoriteSchema);
