import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { MessageType, ContentType } from '../../constants/communication';

export interface IMessage extends Document {
  messageId: string;
  conversationId: string;
  senderId: Types.ObjectId;
  senderAppId: string;
  messageType: MessageType;
  contentType: ContentType;
  body: string;
  encryptedBody?: string;
  signature?: string;
  conversationKeyId?: string;
  replyToMessageId?: string;
  forwardFromMessageId?: string;
  mentions: string[];
  metadata: Record<string, unknown>;
  scheduledAt?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  autoDeleteAt?: Date;
  editedAt?: Date;
  deletedForEveryone: boolean;
  deletedForUsers: Types.ObjectId[];
  hidden: boolean;
  silent: boolean;
  pinned: boolean;
  deliveryState: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderAppId: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['sms', 'private_chat', 'group_chat', 'broadcast', 'announcement', 'system', 'emergency', 'police', 'justice', 'bank', 'verification', 'silent', 'hidden'],
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'image', 'video', 'voice_note', 'audio', 'pdf', 'document', 'contact', 'location', 'live_location', 'money_request', 'bank_transfer', 'identity_card', 'qr', 'barcode', 'gif', 'emoji'],
      default: 'text',
    },
    body: { type: String, default: '' },
    encryptedBody: { type: String },
    signature: { type: String },
    conversationKeyId: { type: String },
    replyToMessageId: { type: String, index: true },
    forwardFromMessageId: { type: String },
    mentions: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} },
    scheduledAt: { type: Date, index: true },
    sentAt: { type: Date, index: true },
    expiresAt: { type: Date },
    autoDeleteAt: { type: Date, index: true },
    editedAt: { type: Date },
    deletedForEveryone: { type: Boolean, default: false },
    deletedForUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hidden: { type: Boolean, default: false },
    silent: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    deliveryState: { type: String, default: 'queued', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, sentAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
