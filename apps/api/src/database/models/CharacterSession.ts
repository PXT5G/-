import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CharacterPlatform, CharacterSessionStatus } from '../../constants/characterPhone';

export interface ICharacterSession extends Document {
  sessionId: string;
  platform: CharacterPlatform;
  externalUserId: string;
  externalCharacterId: string;
  characterRecordId: string;
  phoneId?: string;
  inventorySessionId?: string;
  gulfosUserId?: Types.ObjectId;
  status: CharacterSessionStatus;
  isActiveCharacter: boolean;
  startedAt: Date;
  endedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const characterSessionSchema = new Schema<ICharacterSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    characterRecordId: { type: String, required: true, index: true },
    phoneId: { type: String, index: true },
    inventorySessionId: { type: String, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, default: 'active', index: true },
    isActiveCharacter: { type: Boolean, default: true, index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

characterSessionSchema.index(
  { platform: 1, externalUserId: 1, isActiveCharacter: 1, status: 1 },
  { partialFilterExpression: { status: 'active', isActiveCharacter: true } }
);

export const CharacterSession = mongoose.model<ICharacterSession>(
  'CharacterSession',
  characterSessionSchema
);
