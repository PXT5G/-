import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CharacterPhoneStatus } from '../../constants/characterPhone';

export interface ICharacterPhone extends Document {
  phoneId: string;
  characterRecordId: string;
  platform: string;
  externalCharacterId: string;
  externalUserId: string;
  gulfosUserId?: Types.ObjectId;
  deviceUuid: string;
  phoneNumber: string;
  inventoryItemId: string;
  status: CharacterPhoneStatus;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const characterPhoneSchema = new Schema<ICharacterPhone>(
  {
    phoneId: { type: String, required: true, unique: true, index: true },
    characterRecordId: { type: String, required: true, index: true },
    platform: { type: String, required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deviceUuid: { type: String, required: true, index: true },
    phoneNumber: { type: String, required: true },
    inventoryItemId: { type: String, required: true },
    status: { type: String, default: 'active', index: true },
    activatedAt: { type: Date },
  },
  { timestamps: true }
);

characterPhoneSchema.index({ platform: 1, externalCharacterId: 1 }, { unique: true });
characterPhoneSchema.index({ deviceUuid: 1 }, { unique: true, sparse: true });

export const CharacterPhone = mongoose.model<ICharacterPhone>('CharacterPhone', characterPhoneSchema);
