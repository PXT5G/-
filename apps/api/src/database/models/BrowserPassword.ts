import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IBrowserPassword extends Document {
  passwordId: string;
  userId: Types.ObjectId;
  origin: string;
  username: string;
  encryptedPassword: string;
  label?: string;
  biometricProtected: boolean;
  lastUsedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const browserPasswordSchema = new Schema<IBrowserPassword>(
  {
    passwordId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    origin: { type: String, required: true, index: true },
    username: { type: String, required: true },
    encryptedPassword: { type: String, required: true },
    label: { type: String },
    biometricProtected: { type: Boolean, default: false },
    lastUsedAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BrowserPassword = mongoose.model<IBrowserPassword>('BrowserPassword', browserPasswordSchema);
