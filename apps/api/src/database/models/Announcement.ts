import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAnnouncement extends Document {
  announcementId: string;
  conversationId: string;
  authorId: Types.ObjectId;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  publishedAt?: Date;
  expiresAt?: Date;
  pinned: boolean;
  audienceType: string;
  metadata: Record<string, unknown>;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    announcementId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
    publishedAt: { type: Date, index: true },
    expiresAt: { type: Date },
    pinned: { type: Boolean, default: false },
    audienceType: { type: String, default: 'all' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
