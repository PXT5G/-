import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPoetryFollow extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}

const poetryFollowSchema = new Schema<IPoetryFollow>(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    followingId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

poetryFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const PoetryFollow = mongoose.model<IPoetryFollow>('PoetryFollow', poetryFollowSchema);
