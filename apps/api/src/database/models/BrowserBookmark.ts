import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IBrowserBookmark extends Document {
  bookmarkId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  folder: string;
  favorite: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const browserBookmarkSchema = new Schema<IBrowserBookmark>(
  {
    bookmarkId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    folder: { type: String, default: 'Bookmarks', index: true },
    favorite: { type: Boolean, default: false, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BrowserBookmark = mongoose.model<IBrowserBookmark>('BrowserBookmark', browserBookmarkSchema);
