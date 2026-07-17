import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDiscordLink extends Document {
  linkId: string;
  gulfosUserId: Types.ObjectId;
  discordUserId: string;
  dmChannelId?: string;
  notificationsEnabled: boolean;
  dmAvailable: boolean;
  displayName?: string;
  linkedAt: Date;
  unlinkedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const discordLinkSchema = new Schema<IDiscordLink>(
  {
    linkId: { type: String, required: true, unique: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    discordUserId: { type: String, required: true, unique: true, index: true },
    dmChannelId: { type: String, index: true },
    notificationsEnabled: { type: Boolean, default: true },
    dmAvailable: { type: Boolean, default: true },
    displayName: { type: String },
    linkedAt: { type: Date, default: Date.now },
    unlinkedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const DiscordLink = mongoose.model<IDiscordLink>('DiscordLink', discordLinkSchema);
