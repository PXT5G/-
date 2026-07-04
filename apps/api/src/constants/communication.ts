/** GULFOS Communication Core — shared enums and limits */

export const COMMUNICATION_APP = 'com.gulfos.communication';

export const MESSAGE_TYPES = [
  'sms',
  'private_chat',
  'group_chat',
  'broadcast',
  'announcement',
  'system',
  'emergency',
  'police',
  'justice',
  'bank',
  'verification',
  'silent',
  'hidden',
] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const CONTENT_TYPES = [
  'text',
  'image',
  'video',
  'voice_note',
  'audio',
  'pdf',
  'document',
  'contact',
  'location',
  'live_location',
  'money_request',
  'bank_transfer',
  'identity_card',
  'qr',
  'barcode',
  'gif',
  'emoji',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONVERSATION_TYPES = [
  'private',
  'group',
  'organization',
  'government',
  'police',
  'justice',
  'emergency',
  'bank',
  'business',
  'announcement',
] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const PRESENCE_STATES = [
  'online',
  'offline',
  'idle',
  'typing',
  'recording_voice',
  'uploading',
  'downloading',
  'reading',
  'invisible',
  'dnd',
] as const;
export type PresenceState = (typeof PRESENCE_STATES)[number];

export const DELIVERY_STATES = [
  'queued',
  'uploading',
  'encrypting',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed',
  'retry',
  'cancelled',
] as const;
export type DeliveryState = (typeof DELIVERY_STATES)[number];

export const CONVERSATION_ROLES = ['owner', 'admin', 'moderator', 'member', 'viewer'] as const;
export type ConversationRoleType = (typeof CONVERSATION_ROLES)[number];

export const ATTACHMENT_LIMITS = {
  maxFileSizeBytes: 100 * 1024 * 1024,
  maxImageSizeBytes: 25 * 1024 * 1024,
  maxVideoSizeBytes: 500 * 1024 * 1024,
  maxVoiceNoteSeconds: 300,
  chunkSizeBytes: 256 * 1024,
} as const;

export const MESSAGE_PAGE_SIZE = 50;

export const TYPING_EXPIRY_MS = 8_000;

export const PRESENCE_IDLE_MS = 5 * 60 * 1000;
