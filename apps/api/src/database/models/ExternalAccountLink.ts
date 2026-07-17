import mongoose, { Schema, Document, Types } from 'mongoose';
import type { CharacterPlatform } from '../../constants/characterPhone';

export interface IExternalAccountLink extends Document {
  linkId: string;
  platform: CharacterPlatform;
  externalUserId: string;
  gulfosUserId: Types.ObjectId;
  linkedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const externalAccountLinkSchema = new Schema<IExternalAccountLink>(
  {
    linkId: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    linkedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

externalAccountLinkSchema.index({ platform: 1, externalUserId: 1 }, { unique: true });

export const ExternalAccountLink = mongoose.model<IExternalAccountLink>(
  'ExternalAccountLink',
  externalAccountLinkSchema
);
