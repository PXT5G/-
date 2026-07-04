/** GULF Chat — com.gulfos.chat constants */

export const CHAT_APP_BUNDLE = 'com.gulfos.chat' as const;

export const CHAT_CONVERSATION_KINDS = [
  'private', 'group', 'channel', 'community', 'broadcast',
] as const;
export type ChatConversationKind = (typeof CHAT_CONVERSATION_KINDS)[number];

export const CHAT_GROUP_ROLES = ['owner', 'admin', 'moderator', 'member', 'guest'] as const;
export type ChatGroupRole = (typeof CHAT_GROUP_ROLES)[number];

export const CHAT_MESSAGE_REQUEST_STATUSES = ['pending', 'accepted', 'declined', 'blocked'] as const;
export type ChatMessageRequestStatus = (typeof CHAT_MESSAGE_REQUEST_STATUSES)[number];

export const CHAT_CALL_TYPES = ['voice', 'video', 'conference'] as const;
export type ChatCallType = (typeof CHAT_CALL_TYPES)[number];

export const CHAT_CALL_STATUSES = [
  'ringing', 'connecting', 'active', 'on_hold', 'ended', 'missed', 'declined', 'failed',
] as const;
export type ChatCallStatus = (typeof CHAT_CALL_STATUSES)[number];

export const CHAT_JOIN_REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ChatJoinRequestStatus = (typeof CHAT_JOIN_REQUEST_STATUSES)[number];

export const CHAT_PRIVACY_LEVELS = ['everyone', 'contacts', 'nobody'] as const;
export type ChatPrivacyLevel = (typeof CHAT_PRIVACY_LEVELS)[number];

export const CHAT_PERMISSIONS = [
  'chat.access',
  'chats.private',
  'chats.group',
  'chats.channel',
  'chats.community',
  'chats.broadcast',
  'chats.archive',
  'chats.pin',
  'chats.favorite',
  'chats.search',
  'chats.message_requests',
  'messages.send',
  'messages.edit',
  'messages.delete',
  'messages.forward',
  'messages.schedule',
  'messages.auto_delete',
  'messages.reactions',
  'messages.polls',
  'messages.stickers',
  'media.send',
  'media.voice_note',
  'media.location',
  'media.contact_card',
  'media.identity_card',
  'media.bank_transfer',
  'media.qr',
  'calls.voice',
  'calls.video',
  'calls.conference',
  'calls.record',
  'calls.transfer',
  'groups.manage',
  'groups.invite',
  'groups.roles',
  'privacy.manage',
  'privacy.block',
  'privacy.lock',
  'privacy.biometric',
  'notifications.smart',
  'notifications.priority',
  'sync.offline',
  'devices.trusted',
  'audit.view',
] as const;
export type ChatPermission = (typeof CHAT_PERMISSIONS)[number];

export const CHAT_ROLES = ['user', 'power_user', 'moderator', 'admin'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const DEFAULT_CHAT_ROLE_PERMISSIONS: Record<ChatRole, ChatPermission[]> = {
  user: CHAT_PERMISSIONS.filter((p) =>
    !['calls.record', 'calls.conference', 'chats.channel', 'chats.community',
      'chats.broadcast', 'groups.roles', 'privacy.biometric', 'audit.view'].includes(p)
  ),
  power_user: CHAT_PERMISSIONS.filter((p) =>
    !['calls.record', 'audit.view'].includes(p)
  ),
  moderator: CHAT_PERMISSIONS.filter((p) => p !== 'audit.view'),
  admin: [...CHAT_PERMISSIONS],
};

export const CHAT_SOCKET_EVENTS = [
  'chat:initialized',
  'chat:conversation:update',
  'chat:message:request',
  'chat:call:ringing',
  'chat:call:update',
  'chat:call:ended',
  'chat:poll:update',
  'chat:typing',
  'chat:presence',
  'chat:notification',
  'chat:sync',
] as const;

export const CHAT_STICKER_PACKS = [
  { packId: 'gulf-default', name: 'GULF Expressions', stickerCount: 12 },
  { packId: 'gulf-police', name: 'GULF Police', stickerCount: 8 },
  { packId: 'gulf-celebrate', name: 'Celebrate', stickerCount: 10 },
] as const;

export const CHAT_EMOJI_CATEGORIES = ['smileys', 'gestures', 'nature', 'food', 'activities', 'objects', 'symbols'] as const;
