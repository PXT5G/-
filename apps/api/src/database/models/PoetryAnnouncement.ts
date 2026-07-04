import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPoetryAnnouncement extends Document {
  announcementId: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
  authorId: Types.ObjectId;
  pinned: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const poetryAnnouncementSchema = new Schema<IPoetryAnnouncement>(
  {
    announcementId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pinned: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PoetryAnnouncement = mongoose.model<IPoetryAnnouncement>('PoetryAnnouncement', poetryAnnouncementSchema);
