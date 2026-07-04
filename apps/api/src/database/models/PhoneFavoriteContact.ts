import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneFavoriteContact extends Document {
  userId: Types.ObjectId;
  contactId?: Types.ObjectId;
  phoneNumber: string;
  label: string;
  position: number;
  avatar?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const phoneFavoriteSchema = new Schema<IPhoneFavoriteContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    phoneNumber: { type: String, required: true },
    label: { type: String, required: true },
    position: { type: Number, default: 0 },
    avatar: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_favorite_contacts' }
);

phoneFavoriteSchema.index({ userId: 1, position: 1 });
phoneFavoriteSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

export const PhoneFavoriteContact = mongoose.model<IPhoneFavoriteContact>('PhoneFavoriteContact', phoneFavoriteSchema);
