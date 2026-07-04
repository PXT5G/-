import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMessageAttachment extends Document {
  attachmentId: string;
  messageId: string;
  conversationId: string;
  userId: Types.ObjectId;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  encrypted: boolean;
  checksum: string;
  uploadState: 'pending' | 'uploading' | 'scanning' | 'ready' | 'failed';
  uploadProgress: number;
  chunkCount: number;
  uploadedChunks: number;
  virusScanResult: 'pending' | 'clean' | 'infected' | 'skipped';
  width?: number;
  height?: number;
  durationSeconds?: number;
  thumbnailPath?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageAttachmentSchema = new Schema<IMessageAttachment>(
  {
    attachmentId: { type: String, required: true, unique: true, index: true },
    messageId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    encrypted: { type: Boolean, default: true },
    checksum: { type: String, required: true },
    uploadState: { type: String, enum: ['pending', 'uploading', 'scanning', 'ready', 'failed'], default: 'pending' },
    uploadProgress: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 1 },
    uploadedChunks: { type: Number, default: 0 },
    virusScanResult: { type: String, enum: ['pending', 'clean', 'infected', 'skipped'], default: 'pending' },
    width: { type: Number },
    height: { type: Number },
    durationSeconds: { type: Number },
    thumbnailPath: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const MessageAttachment = mongoose.model<IMessageAttachment>('MessageAttachment', messageAttachmentSchema);
