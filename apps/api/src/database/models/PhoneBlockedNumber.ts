import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhoneBlockedNumber extends Document {
  userId: Types.ObjectId;
  phoneNumber: string;
  label?: string;
  reason?: string;
  blockType: 'call' | 'sms' | 'both';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const phoneBlockedSchema = new Schema<IPhoneBlockedNumber>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneNumber: { type: String, required: true },
    label: { type: String },
    reason: { type: String },
    blockType: { type: String, enum: ['call', 'sms', 'both'], default: 'call' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'phone_blocked_numbers' }
);

phoneBlockedSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

export const PhoneBlockedNumber = mongoose.model<IPhoneBlockedNumber>('PhoneBlockedNumber', phoneBlockedSchema);
