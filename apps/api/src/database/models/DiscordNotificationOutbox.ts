import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DiscordNotificationCategory } from '../../constants/discordNotifications';

export type DiscordOutboxStatus = 'pending' | 'grouped' | 'delivered' | 'failed' | 'skipped' | 'cancelled';

export interface IDiscordNotificationOutbox extends Document {
  outboxId: string;
  gulfosUserId: Types.ObjectId;
  discordUserId: string;
  dmChannelId?: string;
  externalCharacterId: string;
  phoneId?: string;
  category: DiscordNotificationCategory;
  priority: string;
  notificationId: string;
  queueId: string;
  embedPayload: Record<string, unknown>;
  status: DiscordOutboxStatus;
  groupedCount?: number;
  deliveredAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const discordNotificationOutboxSchema = new Schema<IDiscordNotificationOutbox>(
  {
    outboxId: { type: String, required: true, unique: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    discordUserId: { type: String, required: true, index: true },
    dmChannelId: { type: String },
    externalCharacterId: { type: String, required: true, index: true },
    phoneId: { type: String, index: true },
    category: { type: String, required: true, index: true },
    priority: { type: String, required: true },
    notificationId: { type: String, required: true },
    queueId: { type: String, required: true },
    embedPayload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, default: 'pending', index: true },
    groupedCount: { type: Number },
    deliveredAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

discordNotificationOutboxSchema.index({ status: 1, createdAt: 1 });
discordNotificationOutboxSchema.index({ discordUserId: 1, status: 1, createdAt: -1 });

export const DiscordNotificationOutbox = mongoose.model<IDiscordNotificationOutbox>(
  'DiscordNotificationOutbox',
  discordNotificationOutboxSchema
);
