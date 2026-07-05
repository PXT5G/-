/** GULF Assistant — com.gulfos.assistant OS assistant constants */

export const ASSISTANT_APP_BUNDLE = 'com.gulfos.assistant' as const;

export const ASSISTANT_ROLES = ['user', 'admin', 'system'] as const;
export type AssistantRole = (typeof ASSISTANT_ROLES)[number];

export const ASSISTANT_PERMISSIONS = [
  'platform.access', 'conversation.create', 'conversation.view', 'conversation.delete',
  'voice.enable', 'voice.commands', 'actions.execute', 'actions.confirm',
  'apps.control', 'device.control', 'settings.control', 'search.global',
  'bank.view', 'bank.transfer', 'business.view', 'calendar.manage',
  'notes.manage', 'contacts.call', 'messages.send', 'mail.send',
  'emergency.access', 'reports.generate', 'memory.view', 'memory.manage',
  'audit.view',
] as const;
export type AssistantPermission = (typeof ASSISTANT_PERMISSIONS)[number];

export const DEFAULT_ASSISTANT_ROLE_PERMISSIONS: Record<AssistantRole, AssistantPermission[]> = {
  user: ASSISTANT_PERMISSIONS.filter((p) => p !== 'audit.view' && p !== 'bank.transfer'),
  admin: [...ASSISTANT_PERMISSIONS],
  system: [...ASSISTANT_PERMISSIONS],
};

export const MESSAGE_ROLES = ['user', 'assistant', 'system', 'tool'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const ACTION_STATUSES = ['pending', 'confirmed', 'executing', 'completed', 'failed', 'cancelled'] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_TYPES = [
  'open_app', 'close_app', 'search', 'call_contact', 'send_message', 'send_email',
  'create_note', 'create_event', 'create_reminder', 'transfer_money', 'toggle_wifi',
  'toggle_bluetooth', 'set_brightness', 'set_volume', 'start_navigation',
  'generate_report', 'summarize', 'run_shortcut', 'run_automation',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ASSISTANT_SOCKET_EVENTS = [
  'assistant:update', 'assistant:conversation', 'assistant:thinking',
  'assistant:voice', 'assistant:action', 'assistant:completed',
  'assistant:initialized',
] as const;

export const VOICE_SESSION_STATUSES = ['idle', 'listening', 'processing', 'speaking', 'ended'] as const;
