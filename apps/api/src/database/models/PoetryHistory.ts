import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryHistory extends Document {
  userId: Types.ObjectId;
  poemId: string;
  readAt: Date;
}

const poetryHistorySchema = new Schema<IPoetryHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    poemId: { type: String, required: true, index: true },
    readAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

poetryHistorySchema.index({ userId: 1, poemId: 1 }, { unique: true });

export const PoetryHistory = mongoose.model<IPoetryHistory>('PoetryHistory', poetryHistorySchema);
