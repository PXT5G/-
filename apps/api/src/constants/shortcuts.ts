/** GULF Shortcuts — com.gulfos.shortcuts */

export const SHORTCUTS_APP_BUNDLE = 'com.gulfos.shortcuts' as const;

export const SHORTCUT_ACTION_TYPES = [
  'open_app', 'close_app', 'run_automation', 'call_contact', 'send_message',
  'send_email', 'create_note', 'create_event', 'toggle_wifi', 'toggle_bluetooth',
  'adjust_brightness', 'adjust_volume', 'transfer_money', 'start_navigation',
  'http_request', 'clipboard_copy', 'clipboard_paste', 'show_notification',
  'run_assistant', 'text_processing', 'json_processing', 'file_read', 'file_write',
] as const;
export type ShortcutActionType = (typeof SHORTCUT_ACTION_TYPES)[number];

export const SHORTCUT_SOCKET_EVENTS = [
  'shortcut:run', 'shortcut:updated', 'shortcut:created', 'shortcut:deleted',
] as const;

export const SHORTCUT_PERMISSIONS = [
  'platform.access', 'shortcuts.view', 'shortcuts.create', 'shortcuts.manage',
  'shortcuts.run', 'shortcuts.share', 'shortcuts.import', 'shortcuts.export',
  'audit.view',
] as const;
