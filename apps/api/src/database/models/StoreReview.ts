import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStoreReview extends Document {
  listingId: Types.ObjectId;
  bundleId: string;
  userId: Types.ObjectId;
  username: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const storeReviewSchema = new Schema<IStoreReview>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'StoreListing', required: true, index: true },
    bundleId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 2000 },
    helpful: { type: Number, default: 0 },
  },
  { timestamps: true }
);

storeReviewSchema.index({ bundleId: 1, userId: 1 }, { unique: true });

export const StoreReview = mongoose.model<IStoreReview>('StoreReview', storeReviewSchema);
