import mongoose, { Schema, Document, Types } from 'mongoose';
import type { MailFolder } from '../../constants/mail';
import { auditSchemaFields } from '../baseSchema';

export interface IMailMessage extends Document {
  messageId: string;
  userId: Types.ObjectId;
  phoneId?: string;
  characterRecordId?: string;
  accountId: string;
  folder: MailFolder;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  isRead: boolean;
  isStarred: boolean;
  isPriority: boolean;
  labels: string[];
  attachments: { name: string; size: number; mimeType: string; path?: string }[];
  scheduledAt?: Date;
  sentAt?: Date;
  receivedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mailMessageSchema = new Schema<IMailMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneId: { type: String, index: true },
    characterRecordId: { type: String, index: true },
    accountId: { type: String, required: true, index: true },
    folder: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: [String], default: [] },
    cc: { type: [String], default: [] },
    bcc: { type: [String], default: [] },
    subject: { type: String, required: true, index: true },
    bodyText: { type: String, default: '' },
    bodyHtml: String,
    isRead: { type: Boolean, default: false, index: true },
    isStarred: { type: Boolean, default: false },
    isPriority: { type: Boolean, default: false },
    labels: { type: [String], default: [] },
    attachments: [{ name: String, size: Number, mimeType: String, path: String }],
    scheduledAt: Date,
    sentAt: Date,
    receivedAt: { type: Date, default: Date.now, index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

mailMessageSchema.index({ userId: 1, folder: 1, receivedAt: -1 });

export const MailMessage = mongoose.model<IMailMessage>('MailMessage', mailMessageSchema);
