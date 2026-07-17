import { Types } from 'mongoose';
import { DiscordLink } from '../../database/models/DiscordLink';
import { DiscordNotificationPreferences } from '../../database/models/DiscordNotificationPreferences';
import { CharacterSession } from '../../database/models/CharacterSession';
import { CharacterPhone } from '../../database/models/CharacterPhone';
import { InventoryAttestation } from '../../database/models/InventoryAttestation';
import { tryAssertPhoneAccessForUser } from '../phonePresenceService';
import { shouldDeliverDuringQuietHours } from './discordQuietHoursService';
import { getActiveVerifiedSessionForCharacter } from './discordVerifiedSessionService';
import {
  APP_ID_CATEGORY_HINTS,
  DISCORD_NOTIFICATION_CATEGORIES,
  DISCORD_DELIVERY_SKIP_REASONS,
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
  verifiedSessionId?: string;
}

export function resolveCategory(context: NotificationDeliveryContext): DiscordNotificationCategory {
  const explicit = context.category ?? (context.payload.category as string | undefined);
  if (explicit && isValidCategory(explicit)) return explicit as DiscordNotificationCategory;
  return APP_ID_CATEGORY_HINTS[context.appId] ?? 'app_notification';
}

function isValidCategory(value: string): value is DiscordNotificationCategory {
  return (DISCORD_NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/**
 * V1 delivery rules — Discord notifications only while player is actively playing.
 * On any failure: do not send, do not queue for later (provider returns silently).
 */
export async function evaluateDiscordDelivery(
  context: NotificationDeliveryContext
): Promise<DiscordDeliveryDecision> {
  const link = await DiscordLink.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    unlinkedAt: null,
  });
  if (!link) return skip(DISCORD_DELIVERY_SKIP_REASONS.DISCORD_NOT_LINKED);
  if (!link.notificationsEnabled) return skip(DISCORD_DELIVERY_SKIP_REASONS.NOTIFICATIONS_DISABLED_SESSION);
  if (!link.dmAvailable || !link.dmChannelId) return skip(DISCORD_DELIVERY_SKIP_REASONS.DISCORD_DM_UNAVAILABLE);

  const activeSession = await CharacterSession.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  }).sort({ startedAt: -1 });

  if (!activeSession) return skip(DISCORD_DELIVERY_SKIP_REASONS.NO_ACTIVE_CHARACTER);

  const targetCharacterId = context.externalCharacterId ?? activeSession.externalCharacterId;
  if (targetCharacterId !== activeSession.externalCharacterId) {
    return skip(DISCORD_DELIVERY_SKIP_REASONS.CHARACTER_NOT_ACTIVE);
  }

  const verifiedSession = await getActiveVerifiedSessionForCharacter(context.userId, targetCharacterId);
  if (!verifiedSession) return skip(DISCORD_DELIVERY_SKIP_REASONS.NO_VERIFIED_SESSION);
  if (!verifiedSession.gameConnected) return skip(DISCORD_DELIVERY_SKIP_REASONS.PLAYER_NOT_CONNECTED);
  if (!verifiedSession.notificationsEnabled) return skip(DISCORD_DELIVERY_SKIP_REASONS.NOTIFICATIONS_DISABLED_SESSION);
  if (!verifiedSession.phoneAccessEnabled) return skip(DISCORD_DELIVERY_SKIP_REASONS.PHONE_ACCESS_LOCKED);

  if (verifiedSession.phoneId && context.phoneId && verifiedSession.phoneId !== context.phoneId) {
    return skip(DISCORD_DELIVERY_SKIP_REASONS.VERIFIED_SESSION_MISMATCH);
  }

  const attestation = await InventoryAttestation.findOne({
    inventorySessionId: activeSession.inventorySessionId ?? verifiedSession.inventorySessionId,
    externalCharacterId: targetCharacterId,
    expiresAt: { $gt: new Date() },
  });
  if (!attestation?.hasPhoneItem) {
    return skip(DISCORD_DELIVERY_SKIP_REASONS.PHONE_ACCESS_FAILED);
  }

  const phoneAccess = await tryAssertPhoneAccessForUser(context.userId, {
    platform: 'discord',
    externalUserId: activeSession.externalUserId,
    externalCharacterId: activeSession.externalCharacterId,
    characterSessionId: activeSession.sessionId,
    inventorySessionId: activeSession.inventorySessionId ?? verifiedSession.inventorySessionId,
    phoneId: context.phoneId ?? verifiedSession.phoneId,
  });
  if (!phoneAccess) return skip(DISCORD_DELIVERY_SKIP_REASONS.PHONE_ACCESS_FAILED);

  const phone = await CharacterPhone.findOne({
    externalCharacterId: targetCharacterId,
    status: 'active',
  });
  if (!phone) return skip(DISCORD_DELIVERY_SKIP_REASONS.PHONE_ACCESS_FAILED);

  if (phone.externalCharacterId !== targetCharacterId) {
    return skip(DISCORD_DELIVERY_SKIP_REASONS.CHARACTER_NOT_ACTIVE);
  }

  const prefs = await DiscordNotificationPreferences.findOne({
    gulfosUserId: new Types.ObjectId(context.userId),
    externalCharacterId: targetCharacterId,
  });
  if (prefs && !prefs.discordEnabled) return skip(DISCORD_DELIVERY_SKIP_REASONS.CHARACTER_DISCORD_DISABLED);

  const category = resolveCategory(context);
  if (prefs && prefs.categories[category] === false) {
    return skip(DISCORD_DELIVERY_SKIP_REASONS.CATEGORY_DISABLED);
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
    return skip('QUIET_HOURS');
  }

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
    phoneNumber: phone.phoneNumber,
    category,
    verifiedSessionId: verifiedSession.verifiedSessionId,
  };
}

function skip(reason: string): DiscordDeliveryDecision {
  return { deliver: false, reason };
}
