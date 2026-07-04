import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

/** Per-conversation encryption keys for E2E-ready architecture */
export interface IConversationKey extends Document {
  conversationId: string;
  keyId: string;
  encryptedKey: string;
  algorithm: string;
  version: number;
  rotatedAt: Date;
  trustedDeviceIds: string[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationKeySchema = new Schema<IConversationKey>(
  {
    conversationId: { type: String, required: true, index: true },
    keyId: { type: String, required: true, unique: true },
    encryptedKey: { type: String, required: true },
    algorithm: { type: String, default: 'AES-256-GCM' },
    version: { type: Number, default: 1 },
    rotatedAt: { type: Date, default: Date.now },
    trustedDeviceIds: [{ type: String }],
    ...auditSchemaFields,
  },
  { timestamps: true }
);

conversationKeySchema.index({ conversationId: 1, version: -1 });

export const ConversationKey = mongoose.model<IConversationKey>('ConversationKey', conversationKeySchema);
