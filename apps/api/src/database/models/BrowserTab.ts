import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrowserTab extends Document {
  tabId: string;
  sessionId: string;
  userId: Types.ObjectId;
  url: string;
  title: string;
  favicon?: string;
  pinned: boolean;
  groupId?: string;
  orderIndex: number;
  desktopMode: boolean;
  readerMode: boolean;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  scrollPosition: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const browserTabSchema = new Schema<IBrowserTab>(
  {
    tabId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, default: 'about:blank' },
    title: { type: String, default: 'New Tab' },
    favicon: { type: String },
    pinned: { type: Boolean, default: false, index: true },
    groupId: { type: String, index: true },
    orderIndex: { type: Number, default: 0 },
    desktopMode: { type: Boolean, default: false },
    readerMode: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    canGoBack: { type: Boolean, default: false },
    canGoForward: { type: Boolean, default: false },
    scrollPosition: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BrowserTab = mongoose.model<IBrowserTab>('BrowserTab', browserTabSchema);
