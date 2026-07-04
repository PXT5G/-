import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IPhoneFavorite extends Document {
  favoriteId: string;
  userId: Types.ObjectId;
  contactId?: string;
  label: string;
  number: string;
  speedDialIndex?: number;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const phoneFavoriteSchema = new Schema<IPhoneFavorite>(
  {
    favoriteId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: String,
    label: { type: String, required: true },
    number: { type: String, required: true },
    speedDialIndex: Number,
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const PhoneFavorite = mongoose.model<IPhoneFavorite>('PhoneFavorite', phoneFavoriteSchema);
