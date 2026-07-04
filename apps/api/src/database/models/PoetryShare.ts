import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryShare extends Document {
  shareId: string;
  poemId: string;
  userId: Types.ObjectId;
  channel: string;
  createdAt: Date;
}

const poetryShareSchema = new Schema<IPoetryShare>(
  {
    shareId: { type: String, required: true, unique: true, index: true },
    poemId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, default: 'internal' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PoetryShare = mongoose.model<IPoetryShare>('PoetryShare', poetryShareSchema);
