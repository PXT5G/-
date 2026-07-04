import mongoose, { Schema, Document, Types } from 'mongoose';

export type NumberType = 'standard' | 'premium' | 'reserved';
export type NumberStatus = 'available' | 'assigned' | 'reserved' | 'released';

export interface IPhoneNumber extends Document {
  number: string;
  userId?: Types.ObjectId;
  simProfileId?: Types.ObjectId;
  type: NumberType;
  status: NumberStatus;
  isFavorite: boolean;
  assignedAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const phoneNumberSchema = new Schema<IPhoneNumber>(
  {
    number: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    simProfileId: { type: Schema.Types.ObjectId, ref: 'SIMProfile' },
    type: { type: String, enum: ['standard', 'premium', 'reserved'], default: 'standard' },
    status: { type: String, enum: ['available', 'assigned', 'reserved', 'released'], default: 'available', index: true },
    isFavorite: { type: Boolean, default: false },
    assignedAt: { type: Date },
    releasedAt: { type: Date },
  },
  { timestamps: true }
);

export const PhoneNumber = mongoose.model<IPhoneNumber>('PhoneNumber', phoneNumberSchema);

export function generatePhoneNumber(premium = false): string {
  const area = premium ? 888 : 555;
  const line = Math.floor(1000 + Math.random() * 9000);
  return `+1-BNA-${area}-${line}`;
}

export function isPremiumNumber(number: string): boolean {
  return number.includes('-888-') || /(\d)\1{3,}/.test(number);
}
