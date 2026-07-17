import { Types } from 'mongoose';
import {
  PHONE_NOT_AVAILABLE_CODE,
  PHONE_NOT_AVAILABLE_MESSAGE,
  type CharacterPlatform,
} from '../constants/characterPhone';
import { CharacterSession } from '../database/models/CharacterSession';
import { CharacterPhone } from '../database/models/CharacterPhone';
import { ExternalAccountLink } from '../database/models/ExternalAccountLink';
import { InventoryAttestation } from '../database/models/InventoryAttestation';
import {
  verifyPhoneAccess,
  type CharacterContextInput,
  type PhoneVerificationResult,
} from './characterPhoneService';
import { endActiveSessionsForUser } from './characterSessionService';
import { emitToUser } from './socketService';
import { env } from '../config/env';

export class PhoneNotAvailableError extends Error {
  readonly code = PHONE_NOT_AVAILABLE_CODE;
  readonly statusCode = 403;

  constructor(message: string = PHONE_NOT_AVAILABLE_MESSAGE) {
    super(message);
    this.name = 'PhoneNotAvailableError';
  }
}

export { PHONE_NOT_AVAILABLE_CODE, PHONE_NOT_AVAILABLE_MESSAGE };

/**
 * Single source of phone presence validation.
 * All phone actions must call this before executing any logic.
 */
export async function assertPhoneAccess(
  input: CharacterContextInput,
  gulfosUserId?: string
): Promise<PhoneVerificationResult> {
  const result = await verifyPhoneAccess(input);
  if (!result.verified) {
    if (gulfosUserId) {
      await handlePhoneUnavailable(gulfosUserId, result.code);
    }
    throw new PhoneNotAvailableError();
  }
  return result;
}

export async function assertPhoneAccessForUser(
  gulfosUserId: string,
  override?: Partial<CharacterContextInput> | null
): Promise<PhoneVerificationResult> {
  const resolved = await resolveContextForGulfosUser(gulfosUserId);
  const merged = { ...resolved, ...filterOverrides(override) } as Partial<CharacterContextInput>;

  if (!merged.platform || !merged.externalUserId || !merged.externalCharacterId) {
    await handlePhoneUnavailable(gulfosUserId, 'NO_CHARACTER_SESSION');
    throw new PhoneNotAvailableError();
  }

  if (!merged.characterSessionId && !merged.inventorySessionId) {
    await handlePhoneUnavailable(gulfosUserId, 'NO_CHARACTER_SESSION');
    throw new PhoneNotAvailableError();
  }

  return assertPhoneAccess(merged as CharacterContextInput, gulfosUserId);
}

export async function tryAssertPhoneAccessForUser(
  gulfosUserId: string,
  override?: Partial<CharacterContextInput> | null
): Promise<PhoneVerificationResult | null> {
  try {
    return await assertPhoneAccessForUser(gulfosUserId, override);
  } catch (err) {
    if (err instanceof PhoneNotAvailableError) return null;
    throw err;
  }
}

export async function resolveContextForGulfosUser(
  gulfosUserId: string
): Promise<Partial<CharacterContextInput> | null> {
  const session = await CharacterSession.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  }).sort({ startedAt: -1 });

  if (!session) return null;

  const phone = await CharacterPhone.findOne({
    platform: session.platform,
    externalCharacterId: session.externalCharacterId,
  });

  return {
    platform: session.platform as CharacterPlatform,
    externalUserId: session.externalUserId,
    externalCharacterId: session.externalCharacterId,
    characterSessionId: session.sessionId,
    inventorySessionId: session.inventorySessionId,
    phoneId: session.phoneId ?? phone?.phoneId,
    deviceId: phone?.deviceUuid,
  };
}

export async function handlePhoneUnavailable(
  gulfosUserId: string,
  reason?: string
): Promise<void> {
  const session = await CharacterSession.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
  }).sort({ startedAt: -1 });

  if (session) {
    await endActiveSessionsForUser(
      session.platform as CharacterPlatform,
      session.externalUserId,
      reason ?? 'phone_unavailable'
    );
  }

  emitToUser(gulfosUserId, 'phone:unavailable', {
    code: PHONE_NOT_AVAILABLE_CODE,
    message: PHONE_NOT_AVAILABLE_MESSAGE,
    reason: reason ?? PHONE_NOT_AVAILABLE_CODE,
  });
}

export async function revokePhonePresence(input: {
  platform: CharacterPlatform;
  externalCharacterId: string;
  reason: 'seized' | 'transferred' | 'deleted' | 'suspended' | 'unbound';
  inventorySessionId?: string;
}): Promise<void> {
  const phone = await CharacterPhone.findOne({
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
  });

  if (phone) {
    phone.status = input.reason;
    await phone.save();

    if (phone.gulfosUserId) {
      await handlePhoneUnavailable(phone.gulfosUserId.toString(), input.reason);
    }
  }

  if (input.inventorySessionId) {
    await InventoryAttestation.updateMany(
      {
        inventorySessionId: input.inventorySessionId,
        externalCharacterId: input.externalCharacterId,
      },
      { hasPhoneItem: false, expiresAt: new Date() }
    );
  } else {
    await InventoryAttestation.updateMany(
      { externalCharacterId: input.externalCharacterId, platform: input.platform },
      { hasPhoneItem: false, expiresAt: new Date() }
    );
  }
}

function filterOverrides(
  override?: Partial<CharacterContextInput> | null
): Partial<CharacterContextInput> {
  if (!override) return {};
  const out: Partial<CharacterContextInput> = {};
  for (const [k, v] of Object.entries(override)) {
    if (v !== undefined && v !== null) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export async function hasActiveCharacterSession(gulfosUserId: string): Promise<boolean> {
  const count = await CharacterSession.countDocuments({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  });
  return count > 0;
}

export async function shouldEnforcePhonePresence(gulfosUserId: string): Promise<boolean> {
  if (env.PHONE_PRESENCE_ENFORCE) return true;
  return hasActiveCharacterSession(gulfosUserId);
}
