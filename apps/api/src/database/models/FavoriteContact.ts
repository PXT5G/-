import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFavoriteContact extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  sortOrder: number;
  createdAt: Date;
}

const favoriteContactSchema = new Schema<IFavoriteContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

favoriteContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

export const FavoriteContact = mongoose.model<IFavoriteContact>('FavoriteContact', favoriteContactSchema);
