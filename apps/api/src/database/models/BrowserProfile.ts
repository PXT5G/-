import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { BrowserRole, SearchEngine } from '../../constants/browser';

export interface IBrowserProfile extends Document {
  userId: Types.ObjectId;
  role: BrowserRole;
  defaultSearchEngine: SearchEngine;
  desktopModeDefault: boolean;
  blockPopups: boolean;
  doNotTrack: boolean;
  saveHistory: boolean;
  syncTabs: boolean;
  syncBookmarks: boolean;
  readerModeDefault: boolean;
  homePageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const browserProfileSchema = new Schema<IBrowserProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    role: { type: String, default: 'user', index: true },
    defaultSearchEngine: { type: String, default: 'gulf' },
    desktopModeDefault: { type: Boolean, default: false },
    blockPopups: { type: Boolean, default: true },
    doNotTrack: { type: Boolean, default: true },
    saveHistory: { type: Boolean, default: true },
    syncTabs: { type: Boolean, default: true },
    syncBookmarks: { type: Boolean, default: true },
    readerModeDefault: { type: Boolean, default: false },
    homePageUrl: { type: String, default: 'https://www.gulfos.com' },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BrowserProfile = mongoose.model<IBrowserProfile>('BrowserProfile', browserProfileSchema);
