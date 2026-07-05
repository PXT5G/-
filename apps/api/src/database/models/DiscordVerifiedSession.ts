import mongoose, { Schema, Document, Types } from 'mongoose';

export type DiscordVerifiedSessionStatus = 'active' | 'ended';

export interface IDiscordVerifiedSession extends Document {
  verifiedSessionId: string;
  gulfosUserId: Types.ObjectId;
  discordUserId: string;
  externalUserId: string;
  externalCharacterId: string;
  characterSessionId?: string;
  phoneId?: string;
  inventorySessionId?: string;
  gameServerId?: string;
  status: DiscordVerifiedSessionStatus;
  gameConnected: boolean;
  notificationsEnabled: boolean;
  phoneAccessEnabled: boolean;
  verifiedAt: Date;
  lastHeartbeatAt: Date;
  endedAt?: Date;
  endReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const discordVerifiedSessionSchema = new Schema<IDiscordVerifiedSession>(
  {
    verifiedSessionId: { type: String, required: true, unique: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    discordUserId: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    characterSessionId: { type: String },
    phoneId: { type: String, index: true },
    inventorySessionId: { type: String },
    gameServerId: { type: String, index: true },
    status: { type: String, default: 'active', index: true },
    gameConnected: { type: Boolean, default: true, index: true },
    notificationsEnabled: { type: Boolean, default: true },
    phoneAccessEnabled: { type: Boolean, default: true },
    verifiedAt: { type: Date, default: Date.now },
    lastHeartbeatAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date },
    endReason: { type: String },
  },
  { timestamps: true }
);

discordVerifiedSessionSchema.index(
  { gulfosUserId: 1, status: 1, gameConnected: 1 },
  { partialFilterExpression: { status: 'active' } }
);

export const DiscordVerifiedSession = mongoose.model<IDiscordVerifiedSession>(
  'DiscordVerifiedSession',
  discordVerifiedSessionSchema
);
