/** GULF Messages (SMS) — com.gulfos.messages */

export const MESSAGES_APP_BUNDLE = 'com.gulfos.messages' as const;

export const MESSAGE_CATEGORIES = [
  'personal',
  'business',
  'government',
  'bank',
  'otp',
  'emergency',
  'spam',
] as const;
export type MessageCategory = (typeof MESSAGE_CATEGORIES)[number];

export const MESSAGES_PERMISSIONS = [
  'messages.access',
  'messages.send',
  'messages.receive',
  'messages.delete',
  'messages.archive',
  'messages.schedule',
  'messages.attachments',
  'messages.spam',
] as const;
export type MessagesPermission = (typeof MESSAGES_PERMISSIONS)[number];

export const MESSAGES_SOCKET_EVENTS = [
  'messages:new',
  'messages:typing',
  'messages:status',
  'messages:updated',
] as const;
