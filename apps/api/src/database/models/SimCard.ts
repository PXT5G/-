import mongoose, { Schema, Document, Types } from 'mongoose';
import type { NetworkGeneration, SimSlot } from '../../constants/sim';
import { auditSchemaFields } from '../baseSchema';

export interface ISimCard extends Document {
  simId: string;
  userId: Types.ObjectId;
  phoneId?: string;
  characterRecordId?: string;
  slot: SimSlot;
  carrier: string;
  phoneNumber: string;
  iccid: string;
  imsi?: string;
  networkGeneration: NetworkGeneration;
  signalStrength: number;
  roaming: boolean;
  isPreferredVoice: boolean;
  isPreferredData: boolean;
  isPreferredSms: boolean;
  simLocked: boolean;
  pinEnabled: boolean;
  apn: string;
  dataUsedMb: number;
  voiceMinutesUsed: number;
  smsCountUsed: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const simCardSchema = new Schema<ISimCard>(
  {
    simId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phoneId: { type: String, index: true },
    characterRecordId: { type: String, index: true },
    slot: { type: String, required: true, index: true },
    carrier: { type: String, required: true, default: 'Gulf Mobile' },
    phoneNumber: { type: String, required: true },
    iccid: { type: String, required: true },
    imsi: String,
    networkGeneration: { type: String, default: '5g' },
    signalStrength: { type: Number, default: 5, min: 0, max: 5 },
    roaming: { type: Boolean, default: false },
    isPreferredVoice: { type: Boolean, default: true },
    isPreferredData: { type: Boolean, default: true },
    isPreferredSms: { type: Boolean, default: true },
    simLocked: { type: Boolean, default: false },
    pinEnabled: { type: Boolean, default: false },
    apn: { type: String, default: 'internet.gulf.mobile' },
    dataUsedMb: { type: Number, default: 0 },
    voiceMinutesUsed: { type: Number, default: 0 },
    smsCountUsed: { type: Number, default: 0 },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

simCardSchema.index({ userId: 1, slot: 1 });
simCardSchema.index({ phoneId: 1, slot: 1 }, { sparse: true });

export const SimCard = mongoose.model<ISimCard>('SimCard', simCardSchema);
