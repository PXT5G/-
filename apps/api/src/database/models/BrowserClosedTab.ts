import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserClosedTab extends Document {
  closedId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  closedAt: Date;
}

const browserClosedTabSchema = new Schema<IBrowserClosedTab>(
  {
    closedId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    closedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const BrowserClosedTab = mongoose.model<IBrowserClosedTab>('BrowserClosedTab', browserClosedTabSchema);
