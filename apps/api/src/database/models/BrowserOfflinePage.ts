import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserOfflinePage extends Document {
  pageId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  content: string;
  cachedAt: Date;
  sizeBytes: number;
  createdAt?: Date;
}

const browserOfflinePageSchema = new Schema<IBrowserOfflinePage>(
  {
    pageId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    cachedAt: { type: Date, default: Date.now },
    sizeBytes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BrowserOfflinePage = mongoose.model<IBrowserOfflinePage>('BrowserOfflinePage', browserOfflinePageSchema);
