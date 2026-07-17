import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CharacterPlatform } from '../../constants/characterPhone';

export interface ICharacter extends Document {
  characterRecordId: string;
  platform: CharacterPlatform;
  externalCharacterId: string;
  externalUserId: string;
  gulfosUserId?: Types.ObjectId;
  displayName: string;
  isPlayable: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const characterSchema = new Schema<ICharacter>(
  {
    characterRecordId: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    displayName: { type: String, required: true, default: 'Character' },
    isPlayable: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

characterSchema.index({ platform: 1, externalCharacterId: 1 }, { unique: true });
characterSchema.index({ platform: 1, externalUserId: 1 });

export const Character = mongoose.model<ICharacter>('Character', characterSchema);
