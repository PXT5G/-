import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserSearchHistory extends Document {
  searchId: string;
  userId: Types.ObjectId;
  query: string;
  engine: string;
  searchedAt: Date;
  incognito: boolean;
}

const browserSearchHistorySchema = new Schema<IBrowserSearchHistory>(
  {
    searchId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true, index: true },
    engine: { type: String, default: 'gulf' },
    searchedAt: { type: Date, default: Date.now, index: true },
    incognito: { type: Boolean, default: false },
  },
  { timestamps: false }
);

export const BrowserSearchHistory = mongoose.model<IBrowserSearchHistory>('BrowserSearchHistory', browserSearchHistorySchema);
