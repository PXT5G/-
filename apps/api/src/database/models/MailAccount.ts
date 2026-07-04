import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IMailAccount extends Document {
  accountId: string;
  userId: Types.ObjectId;
  email: string;
  displayName: string;
  provider: string;
  isDefault: boolean;
  signature?: string;
  unreadCount: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mailAccountSchema = new Schema<IMailAccount>(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String, required: true },
    provider: { type: String, default: 'gulf' },
    isDefault: { type: Boolean, default: false },
    signature: String,
    unreadCount: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const MailAccount = mongoose.model<IMailAccount>('MailAccount', mailAccountSchema);
