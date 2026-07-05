/** GULF Automation — com.gulfos.automation workflow constants */

export const AUTOMATION_APP_BUNDLE = 'com.gulfos.automation' as const;

export const AUTOMATION_STATUSES = ['draft', 'active', 'paused', 'disabled'] as const;
export type AutomationStatus = (typeof AUTOMATION_STATUSES)[number];

export const RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const TRIGGER_TYPES = [
  'time', 'date', 'battery', 'charging', 'low_battery',
  'bluetooth_connected', 'bluetooth_disconnected', 'wifi_connected', 'wifi_lost',
  'vpn_connected', 'headphones_connected', 'vehicle_connected', 'nfc_scan', 'qr_scan',
  'message_received', 'email_received', 'notification', 'calendar_event', 'reminder',
  'weather', 'location', 'geofence', 'stock_price', 'business_revenue',
  'property_sold', 'vehicle_sold', 'police_alert', 'ems_dispatch',
  'justice_hearing', 'emergency_broadcast',
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const ACTION_TYPES = [
  'open_app', 'close_app', 'run_shortcut', 'call_contact', 'send_message',
  'send_email', 'create_reminder', 'create_note', 'create_calendar_event',
  'change_wallpaper', 'enable_focus', 'disable_focus', 'toggle_wifi',
  'toggle_bluetooth', 'toggle_vpn', 'adjust_brightness', 'adjust_volume',
  'transfer_money', 'start_navigation', 'create_notification',
  'run_background_job', 'trigger_assistant',
] as const;
export type AutomationActionType = (typeof ACTION_TYPES)[number];

export const CONDITION_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains'] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export const AUTOMATION_SOCKET_EVENTS = [
  'automation:created', 'automation:updated', 'automation:running',
  'automation:completed', 'automation:failed', 'automation:history',
] as const;

export const AUTOMATION_PERMISSIONS = [
  'platform.access', 'automations.view', 'automations.create', 'automations.manage',
  'automations.run', 'automations.delete', 'triggers.configure', 'actions.configure',
  'history.view', 'analytics.view', 'audit.view',
] as const;
