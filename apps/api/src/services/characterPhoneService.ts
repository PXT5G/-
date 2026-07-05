import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { AppError } from '../api/middleware/errorHandler';
import { Character } from '../database/models/Character';
import { CharacterPhone } from '../database/models/CharacterPhone';
import { ExternalAccountLink } from '../database/models/ExternalAccountLink';
import { InventoryAttestation } from '../database/models/InventoryAttestation';
import {
  CHARACTER_VERIFICATION_ERRORS,
  INVENTORY_ATTESTATION_TTL_MS,
  type CharacterPlatform,
  type CharacterVerificationErrorCode,
} from '../constants/characterPhone';

function recordId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export interface CharacterContextInput {
  platform: CharacterPlatform;
  externalUserId: string;
  externalCharacterId: string;
  characterSessionId?: string;
  inventorySessionId?: string;
  phoneId?: string;
  deviceId?: string;
}

export interface PhoneVerificationResult {
  verified: true;
  platform: CharacterPlatform;
  externalUserId: string;
  externalCharacterId: string;
  characterRecordId: string;
  phoneId: string;
  deviceUuid: string;
  phoneNumber: string;
  gulfosUserId?: string;
  sessionId?: string;
  inventorySessionId?: string;
}

export interface PhoneVerificationFailure {
  verified: false;
  code: CharacterVerificationErrorCode;
  message: string;
}

export type PhoneVerificationOutcome = PhoneVerificationResult | PhoneVerificationFailure;

export function assertCharacterContext(input: Partial<CharacterContextInput>): CharacterContextInput {
  if (!input.platform || !input.externalUserId || !input.externalCharacterId) {
    throw new AppError(400, CHARACTER_VERIFICATION_ERRORS.CONTEXT_INCOMPLETE);
  }
  if (!input.characterSessionId && !input.inventorySessionId) {
    throw new AppError(400, CHARACTER_VERIFICATION_ERRORS.CONTEXT_INCOMPLETE);
  }
  return input as CharacterContextInput;
}

export async function linkExternalAccount(input: {
  platform: CharacterPlatform;
  externalUserId: string;
  gulfosUserId: string;
  metadata?: Record<string, unknown>;
}) {
  const existing = await ExternalAccountLink.findOne({
    platform: input.platform,
    externalUserId: input.externalUserId,
  });
  if (existing) {
    if (existing.gulfosUserId.toString() !== input.gulfosUserId) {
      throw new AppError(409, 'EXTERNAL_ACCOUNT_ALREADY_LINKED');
    }
    return formatLink(existing);
  }

  const doc = await ExternalAccountLink.create({
    linkId: recordId('LNK'),
    platform: input.platform,
    externalUserId: input.externalUserId,
    gulfosUserId: new Types.ObjectId(input.gulfosUserId),
    metadata: input.metadata,
  });
  return formatLink(doc);
}

export async function getExternalAccountLink(platform: CharacterPlatform, externalUserId: string) {
  const doc = await ExternalAccountLink.findOne({ platform, externalUserId });
  return doc ? formatLink(doc) : null;
}

export async function upsertCharacter(input: {
  platform: CharacterPlatform;
  externalCharacterId: string;
  externalUserId: string;
  gulfosUserId?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
}) {
  let doc = await Character.findOne({
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
  });

  if (doc) {
    if (input.displayName) doc.displayName = input.displayName;
    if (input.gulfosUserId) doc.gulfosUserId = new Types.ObjectId(input.gulfosUserId);
    if (input.metadata) doc.metadata = { ...doc.metadata, ...input.metadata };
    await doc.save();
    return formatCharacter(doc);
  }

  doc = await Character.create({
    characterRecordId: recordId('CHR'),
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
    externalUserId: input.externalUserId,
    gulfosUserId: input.gulfosUserId ? new Types.ObjectId(input.gulfosUserId) : undefined,
    displayName: input.displayName ?? 'Character',
    metadata: input.metadata,
  });
  return formatCharacter(doc);
}

export async function getCharacter(platform: CharacterPlatform, externalCharacterId: string) {
  const doc = await Character.findOne({ platform, externalCharacterId });
  return doc ? formatCharacter(doc) : null;
}

export async function bindCharacterPhone(input: {
  platform: CharacterPlatform;
  externalCharacterId: string;
  externalUserId: string;
  gulfosUserId?: string;
  phoneId: string;
  deviceUuid: string;
  phoneNumber: string;
  inventoryItemId: string;
}) {
  const character = await upsertCharacter({
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
    externalUserId: input.externalUserId,
    gulfosUserId: input.gulfosUserId,
  });

  const otherOwner = await CharacterPhone.findOne({
    phoneId: input.phoneId,
    externalCharacterId: { $ne: input.externalCharacterId },
    status: 'active',
  });
  if (otherOwner) {
    throw new AppError(409, CHARACTER_VERIFICATION_ERRORS.PHONE_NOT_OWNED);
  }

  const otherDevice = await CharacterPhone.findOne({
    deviceUuid: input.deviceUuid,
    externalCharacterId: { $ne: input.externalCharacterId },
    status: 'active',
  });
  if (otherDevice) {
    throw new AppError(409, CHARACTER_VERIFICATION_ERRORS.DEVICE_ID_MISMATCH);
  }

  let phone = await CharacterPhone.findOne({
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
  });

  if (phone) {
    phone.phoneId = input.phoneId;
    phone.deviceUuid = input.deviceUuid;
    phone.phoneNumber = input.phoneNumber;
    phone.inventoryItemId = input.inventoryItemId;
    phone.status = 'active';
    phone.activatedAt = new Date();
    if (input.gulfosUserId) phone.gulfosUserId = new Types.ObjectId(input.gulfosUserId);
    await phone.save();
    return formatCharacterPhone(phone);
  }

  phone = await CharacterPhone.create({
    phoneId: input.phoneId,
    characterRecordId: character.characterRecordId,
    platform: input.platform,
    externalCharacterId: input.externalCharacterId,
    externalUserId: input.externalUserId,
    gulfosUserId: input.gulfosUserId ? new Types.ObjectId(input.gulfosUserId) : undefined,
    deviceUuid: input.deviceUuid,
    phoneNumber: input.phoneNumber,
    inventoryItemId: input.inventoryItemId,
    status: 'active',
    activatedAt: new Date(),
  });

  return formatCharacterPhone(phone);
}

export async function getCharacterPhone(platform: CharacterPlatform, externalCharacterId: string) {
  const doc = await CharacterPhone.findOne({
    platform,
    externalCharacterId,
    status: 'active',
  });
  return doc ? formatCharacterPhone(doc) : null;
}

export async function storeInventoryAttestation(input: {
  platform: CharacterPlatform;
  inventorySessionId: string;
  externalUserId: string;
  externalCharacterId: string;
  hasPhoneItem: boolean;
  phoneInventoryItemId?: string;
  phoneId?: string;
  deviceId?: string;
}) {
  const expiresAt = new Date(Date.now() + INVENTORY_ATTESTATION_TTL_MS);
  const existing = await InventoryAttestation.findOne({
    inventorySessionId: input.inventorySessionId,
    externalCharacterId: input.externalCharacterId,
    expiresAt: { $gt: new Date() },
  });

  if (existing) {
    existing.hasPhoneItem = input.hasPhoneItem;
    existing.phoneInventoryItemId = input.phoneInventoryItemId;
    existing.phoneId = input.phoneId;
    existing.deviceId = input.deviceId;
    existing.attestedAt = new Date();
    existing.expiresAt = expiresAt;
    await existing.save();
    return formatAttestation(existing);
  }

  const doc = await InventoryAttestation.create({
    attestationId: recordId('ATT'),
    platform: input.platform,
    inventorySessionId: input.inventorySessionId,
    externalUserId: input.externalUserId,
    externalCharacterId: input.externalCharacterId,
    hasPhoneItem: input.hasPhoneItem,
    phoneInventoryItemId: input.phoneInventoryItemId,
    phoneId: input.phoneId,
    deviceId: input.deviceId,
    expiresAt,
  });
  return formatAttestation(doc);
}

export async function verifyPhoneAccess(input: CharacterContextInput): Promise<PhoneVerificationOutcome> {
  const ctx = assertCharacterContext(input);

  const link = await ExternalAccountLink.findOne({
    platform: ctx.platform,
    externalUserId: ctx.externalUserId,
  });
  if (!link) {
    return fail(CHARACTER_VERIFICATION_ERRORS.USER_NOT_LINKED, 'External user is not linked to a GULFOS account');
  }

  const character = await Character.findOne({
    platform: ctx.platform,
    externalCharacterId: ctx.externalCharacterId,
  });
  if (!character) {
    return fail(CHARACTER_VERIFICATION_ERRORS.CHARACTER_NOT_FOUND, 'Character is not registered');
  }

  const { CharacterSession } = await import('../database/models/CharacterSession');
  const sessionQuery: Record<string, unknown> = {
    platform: ctx.platform,
    externalUserId: ctx.externalUserId,
    externalCharacterId: ctx.externalCharacterId,
    status: 'active',
    isActiveCharacter: true,
    expiresAt: { $gt: new Date() },
  };
  if (ctx.characterSessionId) sessionQuery.sessionId = ctx.characterSessionId;
  if (ctx.inventorySessionId) sessionQuery.inventorySessionId = ctx.inventorySessionId;

  const session = await CharacterSession.findOne(sessionQuery);
  if (!session) {
    return fail(CHARACTER_VERIFICATION_ERRORS.CHARACTER_NOT_ACTIVE, 'Character is not the active character');
  }

  const inventorySessionId = ctx.inventorySessionId ?? session.inventorySessionId;
  if (!inventorySessionId) {
    return fail(CHARACTER_VERIFICATION_ERRORS.SESSION_INVALID, 'Inventory session is required');
  }

  const attestation = await InventoryAttestation.findOne({
    inventorySessionId,
    externalCharacterId: ctx.externalCharacterId,
    expiresAt: { $gt: new Date() },
  });
  if (!attestation || !attestation.hasPhoneItem) {
    return fail(CHARACTER_VERIFICATION_ERRORS.INVENTORY_NO_PHONE, 'Phone item is not present in character inventory');
  }

  const phone = await CharacterPhone.findOne({
    platform: ctx.platform,
    externalCharacterId: ctx.externalCharacterId,
    status: 'active',
  });
  if (!phone) {
    return fail(CHARACTER_VERIFICATION_ERRORS.PHONE_NOT_REGISTERED, 'No phone registered for this character');
  }

  if (phone.externalCharacterId !== ctx.externalCharacterId) {
    return fail(CHARACTER_VERIFICATION_ERRORS.PHONE_NOT_OWNED, 'Phone is owned by a different character');
  }

  if (ctx.phoneId && phone.phoneId !== ctx.phoneId) {
    return fail(CHARACTER_VERIFICATION_ERRORS.PHONE_ID_MISMATCH, 'Phone ID does not match registered phone');
  }

  if (ctx.deviceId && phone.deviceUuid !== ctx.deviceId) {
    return fail(CHARACTER_VERIFICATION_ERRORS.DEVICE_ID_MISMATCH, 'Device ID does not match registered phone');
  }

  if (attestation.phoneId && attestation.phoneId !== phone.phoneId) {
    return fail(CHARACTER_VERIFICATION_ERRORS.PHONE_ID_MISMATCH, 'Attested phone ID does not match');
  }

  if (attestation.deviceId && attestation.deviceId !== phone.deviceUuid) {
    return fail(CHARACTER_VERIFICATION_ERRORS.DEVICE_ID_MISMATCH, 'Attested device ID does not match');
  }

  return {
    verified: true,
    platform: ctx.platform,
    externalUserId: ctx.externalUserId,
    externalCharacterId: ctx.externalCharacterId,
    characterRecordId: character.characterRecordId,
    phoneId: phone.phoneId,
    deviceUuid: phone.deviceUuid,
    phoneNumber: phone.phoneNumber,
    gulfosUserId: link.gulfosUserId.toString(),
    sessionId: session.sessionId,
    inventorySessionId,
  };
}

function fail(code: CharacterVerificationErrorCode, message: string): PhoneVerificationFailure {
  return { verified: false, code, message };
}

function formatLink(doc: InstanceType<typeof ExternalAccountLink>) {
  return {
    linkId: doc.linkId,
    platform: doc.platform,
    externalUserId: doc.externalUserId,
    gulfosUserId: doc.gulfosUserId.toString(),
    linkedAt: doc.linkedAt,
    metadata: doc.metadata,
  };
}

function formatCharacter(doc: InstanceType<typeof Character>) {
  return {
    characterRecordId: doc.characterRecordId,
    platform: doc.platform,
    externalCharacterId: doc.externalCharacterId,
    externalUserId: doc.externalUserId,
    gulfosUserId: doc.gulfosUserId?.toString(),
    displayName: doc.displayName,
    isPlayable: doc.isPlayable,
    metadata: doc.metadata,
  };
}

function formatCharacterPhone(doc: InstanceType<typeof CharacterPhone>) {
  return {
    phoneId: doc.phoneId,
    characterRecordId: doc.characterRecordId,
    platform: doc.platform,
    externalCharacterId: doc.externalCharacterId,
    externalUserId: doc.externalUserId,
    gulfosUserId: doc.gulfosUserId?.toString(),
    deviceUuid: doc.deviceUuid,
    phoneNumber: doc.phoneNumber,
    inventoryItemId: doc.inventoryItemId,
    status: doc.status,
    activatedAt: doc.activatedAt,
  };
}

function formatAttestation(doc: InstanceType<typeof InventoryAttestation>) {
  return {
    attestationId: doc.attestationId,
    platform: doc.platform,
    inventorySessionId: doc.inventorySessionId,
    externalUserId: doc.externalUserId,
    externalCharacterId: doc.externalCharacterId,
    hasPhoneItem: doc.hasPhoneItem,
    phoneInventoryItemId: doc.phoneInventoryItemId,
    phoneId: doc.phoneId,
    deviceId: doc.deviceId,
    attestedAt: doc.attestedAt,
    expiresAt: doc.expiresAt,
  };
}

export async function unbindCharacterPhone(platform: CharacterPlatform, externalCharacterId: string) {
  const phone = await CharacterPhone.findOne({ platform, externalCharacterId, status: 'active' });
  if (!phone) return null;
  phone.status = 'unbound';
  await phone.save();
  return formatCharacterPhone(phone);
}
