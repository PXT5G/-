import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBlockedContact extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const blockedContactSchema = new Schema<IBlockedContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

blockedContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

export const BlockedContact = mongoose.model<IBlockedContact>('BlockedContact', blockedContactSchema);
