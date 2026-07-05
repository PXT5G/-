import mongoose, { Schema, Document, Types } from 'mongoose';
import type { DiscordNotificationCategory } from '../../constants/discordNotifications';

export interface IBatchItem {
  notificationId: string;
  queueId: string;
  category: DiscordNotificationCategory;
  title: string;
  priority: string;
  appId: string;
}

export interface IDiscordNotificationBatch extends Document {
  batchId: string;
  gulfosUserId: Types.ObjectId;
  externalCharacterId: string;
  discordUserId: string;
  items: IBatchItem[];
  windowStartedAt: Date;
  flushAt: Date;
  flushed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const batchItemSchema = new Schema<IBatchItem>(
  {
    notificationId: { type: String, required: true },
    queueId: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    priority: { type: String, required: true },
    appId: { type: String, required: true },
  },
  { _id: false }
);

const discordNotificationBatchSchema = new Schema<IDiscordNotificationBatch>(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    discordUserId: { type: String, required: true },
    items: { type: [batchItemSchema], default: [] },
    windowStartedAt: { type: Date, default: Date.now },
    flushAt: { type: Date, required: true, index: true },
    flushed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

discordNotificationBatchSchema.index(
  { gulfosUserId: 1, externalCharacterId: 1, flushed: 1 },
  { partialFilterExpression: { flushed: false } }
);

export const DiscordNotificationBatch = mongoose.model<IDiscordNotificationBatch>(
  'DiscordNotificationBatch',
  discordNotificationBatchSchema
);
