import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserHistoryEntry extends Document {
  historyId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  visitCount: number;
  lastVisitedAt: Date;
  incognito: boolean;
  createdAt?: Date;
}

const browserHistorySchema = new Schema<IBrowserHistoryEntry>(
  {
    historyId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true, index: true },
    title: { type: String, required: true },
    visitCount: { type: Number, default: 1 },
    lastVisitedAt: { type: Date, default: Date.now, index: true },
    incognito: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

browserHistorySchema.index({ userId: 1, url: 1 });

export const BrowserHistoryEntry = mongoose.model<IBrowserHistoryEntry>('BrowserHistoryEntry', browserHistorySchema);
