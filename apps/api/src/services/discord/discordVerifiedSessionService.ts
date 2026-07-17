import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { DiscordVerifiedSession } from '../../database/models/DiscordVerifiedSession';
import { DiscordLink } from '../../database/models/DiscordLink';
import { DISCORD_VERIFIED_SESSION_STALE_MS } from '../../constants/discordNotifications';
import { cancelPendingDiscordDeliveries } from './discordDeliveryCancelService';
import * as characterSessionService from '../characterSessionService';
import * as characterPhoneService from '../characterPhoneService';
import { handlePhoneUnavailable } from '../phonePresenceService';

function verifiedSessionId(): string {
  return `DVS-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export async function getActiveVerifiedSession(gulfosUserId: string) {
  const staleBefore = new Date(Date.now() - DISCORD_VERIFIED_SESSION_STALE_MS);
  const doc = await DiscordVerifiedSession.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
    gameConnected: true,
    notificationsEnabled: true,
    lastHeartbeatAt: { $gte: staleBefore },
  }).sort({ verifiedAt: -1 });

  return doc ? formatSession(doc) : null;
}

export async function getActiveVerifiedSessionForCharacter(
  gulfosUserId: string,
  externalCharacterId: string
) {
  const session = await getActiveVerifiedSession(gulfosUserId);
  if (!session || session.externalCharacterId !== externalCharacterId) return null;
  return session;
}

export async function isPlayerActivelyConnected(gulfosUserId: string): Promise<boolean> {
  const session = await getActiveVerifiedSession(gulfosUserId);
  return session !== null && session.phoneAccessEnabled;
}

export async function handlePlayerJoin(input: {
  gulfosUserId: string;
  discordUserId: string;
  externalUserId: string;
  externalCharacterId: string;
  gameServerId?: string;
  phoneId?: string;
  inventorySessionId?: string;
  characterSessionId?: string;
  dmChannelId?: string;
  attestation?: {
    hasPhoneItem: boolean;
    phoneInventoryItemId?: string;
    phoneId?: string;
    deviceId?: string;
  };
}) {
  await endVerifiedSessionsForUser(input.gulfosUserId, 'player_rejoin');

  if (input.dmChannelId) {
    await DiscordLink.findOneAndUpdate(
      { gulfosUserId: new Types.ObjectId(input.gulfosUserId) },
      { dmChannelId: input.dmChannelId, dmAvailable: true, notificationsEnabled: true }
    );
  }

  if (input.inventorySessionId && input.attestation) {
    await characterPhoneService.storeInventoryAttestation({
      platform: 'discord',
      inventorySessionId: input.inventorySessionId,
      externalUserId: input.externalUserId,
      externalCharacterId: input.externalCharacterId,
      hasPhoneItem: input.attestation.hasPhoneItem,
      phoneInventoryItemId: input.attestation.phoneInventoryItemId,
      phoneId: input.attestation.phoneId ?? input.phoneId,
      deviceId: input.attestation.deviceId,
    });
  }

  const characterSession = await characterSessionService.openCharacterSession({
    platform: 'discord',
    externalUserId: input.externalUserId,
    externalCharacterId: input.externalCharacterId,
    gulfosUserId: input.gulfosUserId,
    phoneId: input.phoneId,
    inventorySessionId: input.inventorySessionId,
    characterSessionId: input.characterSessionId,
  });

  const doc = await DiscordVerifiedSession.create({
    verifiedSessionId: verifiedSessionId(),
    gulfosUserId: new Types.ObjectId(input.gulfosUserId),
    discordUserId: input.discordUserId,
    externalUserId: input.externalUserId,
    externalCharacterId: input.externalCharacterId,
    characterSessionId: characterSession.sessionId,
    phoneId: input.phoneId,
    inventorySessionId: input.inventorySessionId,
    gameServerId: input.gameServerId,
    status: 'active',
    gameConnected: true,
    notificationsEnabled: true,
    phoneAccessEnabled: true,
    verifiedAt: new Date(),
    lastHeartbeatAt: new Date(),
  });

  return { verifiedSession: formatSession(doc), characterSession };
}

export async function handlePlayerDisconnect(input: {
  gulfosUserId: string;
  reason?: string;
}) {
  const ended = await endVerifiedSessionsForUser(input.gulfosUserId, input.reason ?? 'player_disconnect');
  await cancelPendingDiscordDeliveries(input.gulfosUserId, 'PLAYER_OFFLINE_CANCELLED');

  const active = ended[0];
  if (active) {
    await characterSessionService.endActiveSessionsForUser(
      'discord',
      active.externalUserId,
      input.reason ?? 'player_disconnect'
    );
    await handlePhoneUnavailable(input.gulfosUserId, 'player_disconnect');
  }

  return { endedSessions: ended.map(formatSession) };
}

export async function handleCharacterSwitchForDiscord(input: {
  gulfosUserId: string;
  discordUserId: string;
  externalUserId: string;
  previousCharacterId?: string;
  newCharacterId: string;
  phoneId?: string;
  inventorySessionId?: string;
  gameServerId?: string;
  attestation?: {
    hasPhoneItem: boolean;
    phoneInventoryItemId?: string;
    phoneId?: string;
    deviceId?: string;
  };
}) {
  await endVerifiedSessionsForUser(input.gulfosUserId, 'character_switch');
  if (input.previousCharacterId) {
    await cancelPendingDiscordDeliveries(input.gulfosUserId, 'CHARACTER_SWITCH_CANCELLED', input.previousCharacterId);
  } else {
    await cancelPendingDiscordDeliveries(input.gulfosUserId, 'CHARACTER_SWITCH_CANCELLED');
  }

  return handlePlayerJoin({
    gulfosUserId: input.gulfosUserId,
    discordUserId: input.discordUserId,
    externalUserId: input.externalUserId,
    externalCharacterId: input.newCharacterId,
    gameServerId: input.gameServerId,
    phoneId: input.phoneId,
    inventorySessionId: input.inventorySessionId,
    attestation: input.attestation,
  });
}

export async function handlePhoneRemovedFromInventory(input: {
  gulfosUserId: string;
  externalCharacterId: string;
  inventorySessionId?: string;
}) {
  const sessions = await DiscordVerifiedSession.find({
    gulfosUserId: new Types.ObjectId(input.gulfosUserId),
    externalCharacterId: input.externalCharacterId,
    status: 'active',
  });

  for (const session of sessions) {
    session.phoneAccessEnabled = false;
    session.notificationsEnabled = false;
    session.gameConnected = false;
    await session.save();
  }

  await cancelPendingDiscordDeliveries(input.gulfosUserId, 'PHONE_REMOVED_FROM_INVENTORY', input.externalCharacterId);

  if (input.inventorySessionId) {
    await characterPhoneService.storeInventoryAttestation({
      platform: 'discord',
      inventorySessionId: input.inventorySessionId,
      externalUserId: sessions[0]?.externalUserId ?? '',
      externalCharacterId: input.externalCharacterId,
      hasPhoneItem: false,
    });
  }

  await handlePhoneUnavailable(input.gulfosUserId, 'phone_removed_from_inventory');

  return { locked: true, sessionsEnded: sessions.length };
}

export async function recordSessionHeartbeat(gulfosUserId: string, verifiedSessionIdParam?: string) {
  const query: Record<string, unknown> = {
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
  };
  if (verifiedSessionIdParam) query.verifiedSessionId = verifiedSessionIdParam;

  const doc = await DiscordVerifiedSession.findOne(query);
  if (!doc) return null;

  doc.lastHeartbeatAt = new Date();
  doc.gameConnected = true;
  await doc.save();
  return formatSession(doc);
}

async function endVerifiedSessionsForUser(gulfosUserId: string, reason: string) {
  const active = await DiscordVerifiedSession.find({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
  });

  for (const doc of active) {
    doc.status = 'ended';
    doc.gameConnected = false;
    doc.notificationsEnabled = false;
    doc.phoneAccessEnabled = false;
    doc.endedAt = new Date();
    doc.endReason = reason;
    await doc.save();
  }

  return active;
}

function formatSession(doc: InstanceType<typeof DiscordVerifiedSession>) {
  return {
    verifiedSessionId: doc.verifiedSessionId,
    gulfosUserId: doc.gulfosUserId.toString(),
    discordUserId: doc.discordUserId,
    externalUserId: doc.externalUserId,
    externalCharacterId: doc.externalCharacterId,
    characterSessionId: doc.characterSessionId,
    phoneId: doc.phoneId,
    inventorySessionId: doc.inventorySessionId,
    gameServerId: doc.gameServerId,
    status: doc.status,
    gameConnected: doc.gameConnected,
    notificationsEnabled: doc.notificationsEnabled,
    phoneAccessEnabled: doc.phoneAccessEnabled,
    verifiedAt: doc.verifiedAt,
    lastHeartbeatAt: doc.lastHeartbeatAt,
    endedAt: doc.endedAt,
    endReason: doc.endReason,
  };
}
