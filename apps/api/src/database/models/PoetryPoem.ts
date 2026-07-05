import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PoetryCategory, PoemStatus } from '../../constants/poetry';

export interface IPoetryPoem extends Document {
  poemId: string;
  authorId: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  markdown: string;
  excerpt: string;
  category: PoetryCategory;
  tags: string[];
  status: PoemStatus;
  featured: boolean;
  pinned: boolean;
  isDailyPoem: boolean;
  scheduledAt?: Date;
  publishedAt?: Date;
  coverImageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  backgroundMusicUrl?: string;
  galleryImageIds: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  bookmarkCount: number;
  readingTimeMinutes: number;
  versionNumber: number;
  moderationNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryPoemSchema = new Schema<IPoetryPoem>(
  {
    poemId: { type: String, required: true, unique: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    content: { type: String, default: '' },
    markdown: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    status: { type: String, required: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    pinned: { type: Boolean, default: false, index: true },
    isDailyPoem: { type: Boolean, default: false, index: true },
    scheduledAt: { type: Date, index: true },
    publishedAt: { type: Date, index: true },
    coverImageUrl: { type: String },
    audioUrl: { type: String },
    videoUrl: { type: String },
    backgroundMusicUrl: { type: String },
    galleryImageIds: { type: [String], default: [] },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    readingTimeMinutes: { type: Number, default: 1 },
    versionNumber: { type: Number, default: 1 },
    moderationNote: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

poetryPoemSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const PoetryPoem = mongoose.model<IPoetryPoem>('PoetryPoem', poetryPoemSchema);
