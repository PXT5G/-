/** Character-based phone ownership — platform-agnostic integration layer */

export const CHARACTER_HEADERS = {
  EXTERNAL_USER_ID: 'x-external-user-id',
  CHARACTER_ID: 'x-character-id',
  CHARACTER_SESSION_ID: 'x-character-session-id',
  INVENTORY_SESSION_ID: 'x-inventory-session-id',
  PHONE_ID: 'x-phone-id',
  DEVICE_ID: 'x-device-id',
  PLATFORM: 'x-platform',
} as const;

export const CHARACTER_PLATFORMS = ['discord', 'web', 'simulator'] as const;
export type CharacterPlatform = (typeof CHARACTER_PLATFORMS)[number];

export const CHARACTER_SESSION_STATUS = ['active', 'ended', 'expired'] as const;
export type CharacterSessionStatus = (typeof CHARACTER_SESSION_STATUS)[number];

export const CHARACTER_PHONE_STATUS = ['active', 'suspended', 'unbound', 'seized', 'transferred', 'deleted'] as const;
export type CharacterPhoneStatus = (typeof CHARACTER_PHONE_STATUS)[number];

export const CHARACTER_SOCKET_EVENTS = [
  'character:changed',
  'character:session:ended',
  'character:phone:activated',
  'phone:unavailable',
] as const;

export const PHONE_NOT_AVAILABLE_CODE = 'PHONE_NOT_AVAILABLE' as const;
export const PHONE_NOT_AVAILABLE_MESSAGE = 'الهاتف لم يعد معك';

export const CHARACTER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const INVENTORY_ATTESTATION_TTL_MS = 15 * 60 * 1000;

export const CHARACTER_VERIFICATION_ERRORS = {
  USER_NOT_LINKED: 'CHARACTER_USER_NOT_LINKED',
  CHARACTER_NOT_FOUND: 'CHARACTER_NOT_FOUND',
  CHARACTER_NOT_ACTIVE: 'CHARACTER_NOT_ACTIVE',
  SESSION_INVALID: 'CHARACTER_SESSION_INVALID',
  SESSION_MISMATCH: 'CHARACTER_SESSION_MISMATCH',
  INVENTORY_NO_PHONE: 'INVENTORY_PHONE_ITEM_MISSING',
  PHONE_NOT_OWNED: 'PHONE_NOT_OWNED_BY_CHARACTER',
  PHONE_ID_MISMATCH: 'PHONE_ID_MISMATCH',
  DEVICE_ID_MISMATCH: 'DEVICE_ID_MISMATCH',
  PHONE_NOT_REGISTERED: 'PHONE_NOT_REGISTERED',
  PHONE_NOT_AVAILABLE: PHONE_NOT_AVAILABLE_CODE,
  PHONE_SEIZED: 'PHONE_SEIZED',
  PHONE_TRANSFERRED: 'PHONE_TRANSFERRED',
  PHONE_DELETED: 'PHONE_DELETED',
  CONTEXT_INCOMPLETE: 'CHARACTER_CONTEXT_INCOMPLETE',
} as const;

export type CharacterVerificationErrorCode =
  (typeof CHARACTER_VERIFICATION_ERRORS)[keyof typeof CHARACTER_VERIFICATION_ERRORS];
