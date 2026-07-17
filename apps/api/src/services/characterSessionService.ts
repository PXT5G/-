import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { AppError } from '../api/middleware/errorHandler';
import { CharacterSession } from '../database/models/CharacterSession';
import { CHARACTER_SESSION_TTL_MS, type CharacterPlatform } from '../constants/characterPhone';
import { emitToUser } from './socketService';
import * as characterPhoneService from './characterPhoneService';

function sessionId(): string {
  return `CS-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export async function openCharacterSession(input: {
  platform: CharacterPlatform;
  externalUserId: string;
  externalCharacterId: string;
  gulfosUserId?: string;
  phoneId?: string;
  inventorySessionId?: string;
  characterSessionId?: string;
}) {
  await endActiveSessionsForUser(input.platform, input.externalUserId, 'character_switch');

  const character = await characterPhoneService.upsertCharacter({
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
    externalUserId: input.externalUserId,
    gulfosUserId: input.gulfosUserId,
  });

  const expiresAt = new Date(Date.now() + CHARACTER_SESSION_TTL_MS);
  const doc = await CharacterSession.create({
    sessionId: input.characterSessionId ?? sessionId(),
    platform: input.platform,
    externalUserId: input.externalUserId,
    externalCharacterId: input.externalCharacterId,
    characterRecordId: character.characterRecordId,
    phoneId: input.phoneId,
    inventorySessionId: input.inventorySessionId,
    gulfosUserId: input.gulfosUserId ? new Types.ObjectId(input.gulfosUserId) : undefined,
    status: 'active',
    isActiveCharacter: true,
    expiresAt,
  });

  const phone = await characterPhoneService.getCharacterPhone(input.platform, input.externalCharacterId);
  if (input.gulfosUserId && phone) {
    emitToUser(input.gulfosUserId, 'character:phone:activated', {
      sessionId: doc.sessionId,
      characterId: input.externalCharacterId,
      phoneId: phone.phoneId,
      phoneNumber: phone.phoneNumber,
    });
  }

  return formatSession(doc);
}

export async function handleCharacterChanged(input: {
  platform: CharacterPlatform;
  externalUserId: string;
  previousCharacterId?: string;
  newCharacterId: string;
  gulfosUserId?: string;
  inventorySessionId?: string;
  phoneId?: string;
  deviceId?: string;
  attestation?: {
    hasPhoneItem: boolean;
    phoneInventoryItemId?: string;
    phoneId?: string;
    deviceId?: string;
  };
}) {
  const ended = await endActiveSessionsForUser(input.platform, input.externalUserId, 'character_changed');

  for (const s of ended) {
    if (s.gulfosUserId) {
      emitToUser(s.gulfosUserId.toString(), 'character:session:ended', {
        sessionId: s.sessionId,
        characterId: s.externalCharacterId,
        reason: 'character_changed',
      });
    }
  }

  if (input.attestation && input.inventorySessionId) {
    await characterPhoneService.storeInventoryAttestation({
      platform: input.platform,
      inventorySessionId: input.inventorySessionId,
      externalUserId: input.externalUserId,
      externalCharacterId: input.newCharacterId,
      hasPhoneItem: input.attestation.hasPhoneItem,
      phoneInventoryItemId: input.attestation.phoneInventoryItemId,
      phoneId: input.attestation.phoneId ?? input.phoneId,
      deviceId: input.attestation.deviceId ?? input.deviceId,
    });
  }

  const newSession = await openCharacterSession({
    platform: input.platform,
    externalUserId: input.externalUserId,
    externalCharacterId: input.newCharacterId,
    gulfosUserId: input.gulfosUserId,
    phoneId: input.phoneId,
    inventorySessionId: input.inventorySessionId,
  });

  const phone = await characterPhoneService.getCharacterPhone(input.platform, input.newCharacterId);

  if (input.gulfosUserId) {
    emitToUser(input.gulfosUserId, 'character:changed', {
      previousCharacterId: input.previousCharacterId ?? null,
      newCharacterId: input.newCharacterId,
      sessionId: newSession.sessionId,
      phoneId: phone?.phoneId ?? null,
    });
  }

  return {
    endedSessions: ended.map(formatSession),
    activeSession: newSession,
    phone,
  };
}

export async function endCharacterSession(sessionIdParam: string, reason = 'ended') {
  const doc = await CharacterSession.findOne({ sessionId: sessionIdParam, status: 'active' });
  if (!doc) throw new AppError(404, 'CHARACTER_SESSION_NOT_FOUND');

  doc.status = 'ended';
  doc.isActiveCharacter = false;
  doc.endedAt = new Date();
  await doc.save();

  if (doc.gulfosUserId) {
    emitToUser(doc.gulfosUserId.toString(), 'character:session:ended', {
      sessionId: doc.sessionId,
      characterId: doc.externalCharacterId,
      reason,
    });
  }

  return formatSession(doc);
}

export async function getActiveSession(platform: CharacterPlatform, externalUserId: string) {
  const doc = await CharacterSession.findOne({
    platform,
    externalUserId,
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  }).sort({ startedAt: -1 });

  return doc ? formatSession(doc) : null;
}

export async function endActiveSessionsForUser(
  platform: CharacterPlatform,
  externalUserId: string,
  reason: string
) {
  const active = await CharacterSession.find({
    platform,
    externalUserId,
    status: 'active',
    isActiveCharacter: true,
  });

  const ended: InstanceType<typeof CharacterSession>[] = [];
  for (const doc of active) {
    doc.status = 'ended';
    doc.isActiveCharacter = false;
    doc.endedAt = new Date();
    await doc.save();
    ended.push(doc);

    if (doc.gulfosUserId) {
      emitToUser(doc.gulfosUserId.toString(), 'character:session:ended', {
        sessionId: doc.sessionId,
        characterId: doc.externalCharacterId,
        reason,
      });
    }
  }

  return ended;
}

function formatSession(doc: InstanceType<typeof CharacterSession>) {
  return {
    sessionId: doc.sessionId,
    platform: doc.platform,
    externalUserId: doc.externalUserId,
    externalCharacterId: doc.externalCharacterId,
    characterRecordId: doc.characterRecordId,
    phoneId: doc.phoneId,
    inventorySessionId: doc.inventorySessionId,
    gulfosUserId: doc.gulfosUserId?.toString(),
    status: doc.status,
    isActiveCharacter: doc.isActiveCharacter,
    startedAt: doc.startedAt,
    endedAt: doc.endedAt,
    expiresAt: doc.expiresAt,
  };
}
