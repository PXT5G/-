import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IBrowserSavedCard extends Document {
  cardId: string;
  userId: Types.ObjectId;
  label: string;
  lastFour: string;
  encryptedPayload: string;
  expiryMonth: number;
  expiryYear: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const browserSavedCardSchema = new Schema<IBrowserSavedCard>(
  {
    cardId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true },
    lastFour: { type: String, required: true },
    encryptedPayload: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const BrowserSavedCard = mongoose.model<IBrowserSavedCard>('BrowserSavedCard', browserSavedCardSchema);
