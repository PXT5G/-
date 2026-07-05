import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWatchlist extends Document {
  watchlistId: string;
  userId: Types.ObjectId;
  name: string;
  tickers: string[];
  stockIds: string[];
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    watchlistId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, default: 'Default' },
    tickers: { type: [String], default: [] },
    stockIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

watchlistSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Watchlist = mongoose.model<IWatchlist>('Watchlist', watchlistSchema);
