import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserReadingListItem extends Document {
  itemId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  excerpt: string;
  read: boolean;
  addedAt: Date;
  createdAt?: Date;
}

const browserReadingListSchema = new Schema<IBrowserReadingListItem>(
  {
    itemId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BrowserReadingListItem = mongoose.model<IBrowserReadingListItem>('BrowserReadingListItem', browserReadingListSchema);
