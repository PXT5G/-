import mongoose, { Schema, Document, Types } from 'mongoose';

export type SIMType = 'physical' | 'esim';
export type SIMStatus = 'inactive' | 'active' | 'suspended' | 'deactivated';
export type SIMSlot = 'primary' | 'secondary';
export type SubscriptionPlan = 'standard' | 'premium' | 'unlimited';

export interface ISIMProfile extends Document {
  userId: Types.ObjectId;
  identityId: Types.ObjectId;
  phoneNumberId: Types.ObjectId;
  carrierId: Types.ObjectId;
  simType: SIMType;
  simSerial: string;
  status: SIMStatus;
  isPrimary: boolean;
  slot: SIMSlot;
  subscriptionPlan: SubscriptionPlan;
  activatedAt?: Date;
  suspendedAt?: Date;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const simProfileSchema = new Schema<ISIMProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    identityId: { type: Schema.Types.ObjectId, ref: 'Identity', required: true },
    phoneNumberId: { type: Schema.Types.ObjectId, ref: 'PhoneNumber', required: true },
    carrierId: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
    simType: { type: String, enum: ['physical', 'esim'], default: 'esim' },
    simSerial: { type: String, required: true, unique: true },
    status: { type: String, enum: ['inactive', 'active', 'suspended', 'deactivated'], default: 'inactive', index: true },
    isPrimary: { type: Boolean, default: true },
    slot: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
    subscriptionPlan: { type: String, enum: ['standard', 'premium', 'unlimited'], default: 'standard' },
    activatedAt: { type: Date },
    suspendedAt: { type: Date },
    deactivatedAt: { type: Date },
  },
  { timestamps: true }
);

simProfileSchema.index({ userId: 1, slot: 1 });

export const SIMProfile = mongoose.model<ISIMProfile>('SIMProfile', simProfileSchema);

export function generateICCID(): string {
  const prefix = '8944001';
  let serial = prefix;
  for (let i = 0; i < 12; i++) serial += Math.floor(Math.random() * 10);
  return serial;
}
