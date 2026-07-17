import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  DISCORD_CATEGORY_DEFAULTS,
  type DiscordNotificationCategory,
} from '../../constants/discordNotifications';

export interface IQuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  criticalOnly: boolean;
  muteAll: boolean;
  timezone: string;
}

export interface IDiscordNotificationPreferences extends Document {
  prefId: string;
  gulfosUserId: Types.ObjectId;
  externalCharacterId: string;
  discordEnabled: boolean;
  categories: Record<DiscordNotificationCategory, boolean>;
  quietHours: IQuietHours;
  createdAt: Date;
  updatedAt: Date;
}

const quietHoursSchema = new Schema<IQuietHours>(
  {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' },
    endTime: { type: String, default: '07:00' },
    criticalOnly: { type: Boolean, default: true },
    muteAll: { type: Boolean, default: false },
    timezone: { type: String, default: 'UTC' },
  },
  { _id: false }
);

const discordNotificationPreferencesSchema = new Schema<IDiscordNotificationPreferences>(
  {
    prefId: { type: String, required: true, unique: true, index: true },
    gulfosUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    discordEnabled: { type: Boolean, default: true },
    categories: { type: Schema.Types.Mixed, default: () => ({ ...DISCORD_CATEGORY_DEFAULTS }) },
    quietHours: { type: quietHoursSchema, default: () => ({}) },
  },
  { timestamps: true }
);

discordNotificationPreferencesSchema.index({ gulfosUserId: 1, externalCharacterId: 1 }, { unique: true });

export const DiscordNotificationPreferences = mongoose.model<IDiscordNotificationPreferences>(
  'DiscordNotificationPreferences',
  discordNotificationPreferencesSchema
);
