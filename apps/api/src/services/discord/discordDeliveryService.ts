import { Types } from 'mongoose';
import { DiscordLink } from '../../database/models/DiscordLink';
import { DiscordNotificationPreferences } from '../../database/models/DiscordNotificationPreferences';
import { CharacterSession } from '../../database/models/CharacterSession';
import { CharacterPhone } from '../../database/models/CharacterPhone';
import { tryAssertPhoneAccessForUser } from '../phonePresenceService';
import { shouldDeliverDuringQuietHours } from './discordQuietHoursService';
import {
  APP_ID_CATEGORY_HINTS,
  DISCORD_NOTIFICATION_CATEGORIES,
  type DiscordNotificationCategory,
} from '../../constants/discordNotifications';
import type { NotificationDeliveryContext } from '../../constants/notificationProviders';

export interface DiscordDeliveryDecision {
  deliver: boolean;
  reason?: string;
  discordUserId?: string;
  dmChannelId?: string;
  externalCharacterId?: string;
  characterName?: string;
  phoneNumber?: string;
  category?: DiscordNotificationCategory;
}

export function resolveCategory(context: NotificationDeliveryContext): DiscordNotificationCategory {
  const explicit = context.category ?? (context.payload.category as string | undefined);
  if (explicit && isValidCategory(explicit)) return explicit as DiscordNotificationCategory;
  return APP_ID_CATEGORY_HINTS[context.appId] ?? 'app_notification';
}

function isValidCategory(value: string): value is DiscordNotificationCategory {
  return (DISCORD_NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

export async function evaluateDiscordDelivery(
  context: NotificationDeliveryContext
): Promise<DiscordDeliveryDecision> {
  const link = await DiscordLink.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    unlinkedAt: null,
  });
  if (!link) return { deliver: false, reason: 'DISCORD_NOT_LINKED' };
  if (!link.notificationsEnabled) return { deliver: false, reason: 'DISCORD_NOTIFICATIONS_DISABLED' };
  if (!link.dmAvailable || !link.dmChannelId) return { deliver: false, reason: 'DISCORD_DM_UNAVAILABLE' };

  const activeSession = await CharacterSession.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  }).sort({ startedAt: -1 });

  if (!activeSession) return { deliver: false, reason: 'NO_ACTIVE_CHARACTER' };

  const targetCharacterId = context.externalCharacterId ?? activeSession.externalCharacterId;
  if (targetCharacterId !== activeSession.externalCharacterId) {
    return { deliver: false, reason: 'CHARACTER_NOT_ACTIVE' };
  }

  const phoneAccess = await tryAssertPhoneAccessForUser(context.userId, {
    platform: 'discord',
    externalUserId: activeSession.externalUserId,
    externalCharacterId: activeSession.externalCharacterId,
    characterSessionId: activeSession.sessionId,
    inventorySessionId: activeSession.inventorySessionId,
    phoneId: context.phoneId,
  });
  if (!phoneAccess) return { deliver: false, reason: 'PHONE_ACCESS_FAILED' };

  const prefs = await DiscordNotificationPreferences.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    externalCharacterId: targetCharacterId,
  });
  if (prefs && !prefs.discordEnabled) return { deliver: false, reason: 'CHARACTER_DISCORD_DISABLED' };

  const category = resolveCategory(context);
  if (prefs && prefs.categories[category] === false) {
    return { deliver: false, reason: 'CATEGORY_DISABLED' };
  }

  const quietHours = prefs?.quietHours ?? {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    criticalOnly: true,
    muteAll: false,
    timezone: 'UTC',
  };
  if (!shouldDeliverDuringQuietHours(quietHours, context.priority)) {
    return { deliver: false, reason: 'QUIET_HOURS' };
  }

  const phone = await CharacterPhone.findOne({
    externalCharacterId: targetCharacterId,
    status: 'active',
  });

  const { Character } = await import('../../database/models/Character');
  const character = await Character.findOne({
    platform: 'discord',
    externalCharacterId: targetCharacterId,
  });

  return {
    deliver: true,
    discordUserId: link.discordUserId,
    dmChannelId: link.dmChannelId,
    externalCharacterId: targetCharacterId,
    characterName: character?.displayName ?? 'Character',
    phoneNumber: phone?.phoneNumber,
    category,
  };
}
