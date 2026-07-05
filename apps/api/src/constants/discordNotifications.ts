/** Discord Smart Notification Center V2 */

export const DISCORD_PROVIDER_ID = 'discord' as const;

export const DISCORD_EMBED_COLORS = {
  critical: 0xed4245,
  high: 0xfaa61a,
  normal: 0x5865f2,
  low: 0x99aab5,
} as const;

export const DISCORD_GROUPING_WINDOW_MS = 60_000;

export const DISCORD_NOTIFICATION_CATEGORY_GROUPS = {
  communication: [
    'incoming_call',
    'missed_call',
    'voicemail',
    'sms_message',
    'mail',
    'emergency_alert',
  ],
  banking: [
    'money_received',
    'money_sent',
    'transfer',
    'card_transaction',
    'failed_transaction',
    'suspicious_activity',
  ],
  identity: ['identity_update', 'license_update', 'expiring_document'],
  government: ['police_notice', 'ems_notice', 'court_notification', 'company_notification'],
  marketplace: ['vehicle_sale', 'property_update', 'auction_alert', 'marketplace_message'],
  security: [
    'new_login',
    'password_changed',
    'phone_removed',
    'discord_linked',
    'discord_unlinked',
    'security_alert',
  ],
  device: [
    'battery_low',
    'backup_completed',
    'cloud_sync_finished',
    'find_my_alert',
    'device_locked',
    'device_restored',
  ],
  applications: [
    'app_notification',
    'calendar_reminder',
    'notes_reminder',
    'alarm_notification',
    'package_update',
  ],
} as const;

export const DISCORD_NOTIFICATION_CATEGORIES = [
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.communication,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.banking,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.identity,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.government,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.marketplace,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.security,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.device,
  ...DISCORD_NOTIFICATION_CATEGORY_GROUPS.applications,
] as const;

export type DiscordNotificationCategory = (typeof DISCORD_NOTIFICATION_CATEGORIES)[number];

export const DISCORD_CATEGORY_DEFAULTS: Record<DiscordNotificationCategory, boolean> =
  Object.fromEntries(DISCORD_NOTIFICATION_CATEGORIES.map((c) => [c, true])) as Record<
    DiscordNotificationCategory,
    boolean
  >;

export const DISCORD_CATEGORY_PRIORITY: Record<DiscordNotificationCategory, keyof typeof DISCORD_EMBED_COLORS> = {
  incoming_call: 'critical',
  missed_call: 'normal',
  voicemail: 'normal',
  sms_message: 'normal',
  mail: 'normal',
  emergency_alert: 'critical',
  money_received: 'high',
  money_sent: 'high',
  transfer: 'high',
  card_transaction: 'high',
  failed_transaction: 'high',
  suspicious_activity: 'critical',
  identity_update: 'high',
  license_update: 'high',
  expiring_document: 'normal',
  police_notice: 'high',
  ems_notice: 'high',
  court_notification: 'high',
  company_notification: 'normal',
  vehicle_sale: 'normal',
  property_update: 'normal',
  auction_alert: 'normal',
  marketplace_message: 'normal',
  new_login: 'critical',
  password_changed: 'critical',
  phone_removed: 'critical',
  discord_linked: 'normal',
  discord_unlinked: 'normal',
  security_alert: 'critical',
  battery_low: 'normal',
  backup_completed: 'low',
  cloud_sync_finished: 'low',
  find_my_alert: 'critical',
  device_locked: 'critical',
  device_restored: 'normal',
  app_notification: 'normal',
  calendar_reminder: 'normal',
  notes_reminder: 'normal',
  alarm_notification: 'high',
  package_update: 'low',
};

export const DISCORD_SENSITIVE_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/gi,
  /\biban[:\s]*[a-z]{2}\d{2}[a-z0-9]{10,30}\b/gi,
  /\bpassword[:\s]*\S+/gi,
  /\b(?:otp|verification code)[:\s]*\d{4,8}\b/gi,
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b(?:ssn|national id)[:\s]*\d+/gi,
  /\bbalance[:\s]*\$?[\d,]+\.?\d*/gi,
];

export const DISCORD_BUTTON_REQUIRES_CONFIRMATION = new Set([
  'accept_call',
  'decline_call',
  'transfer_confirm',
  'security_review',
  'open_location',
]);

export interface DiscordEmbedButton {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  requiresConfirmation: boolean;
}

export const DISCORD_CATEGORY_BUTTONS: Partial<Record<DiscordNotificationCategory, DiscordEmbedButton[]>> = {
  incoming_call: [
    { id: 'accept_call', label: '📞 Accept', style: 'success', requiresConfirmation: true },
    { id: 'decline_call', label: '❌ Decline', style: 'danger', requiresConfirmation: true },
  ],
  transfer: [{ id: 'view_transfer', label: 'View Details', style: 'primary', requiresConfirmation: false }],
  card_transaction: [{ id: 'view_transaction', label: 'View Details', style: 'primary', requiresConfirmation: false }],
  mail: [{ id: 'mark_read', label: 'Mark as Read', style: 'secondary', requiresConfirmation: false }],
  calendar_reminder: [
    { id: 'snooze', label: 'Snooze', style: 'secondary', requiresConfirmation: false },
    { id: 'dismiss', label: 'Dismiss', style: 'secondary', requiresConfirmation: false },
  ],
  find_my_alert: [
    { id: 'open_location', label: 'Open Location', style: 'primary', requiresConfirmation: true },
  ],
  security_alert: [
    { id: 'review_activity', label: 'Review Activity', style: 'danger', requiresConfirmation: true },
  ],
};

export const APP_ID_CATEGORY_HINTS: Record<string, DiscordNotificationCategory> = {
  'com.gulfos.phone': 'incoming_call',
  'com.gulfos.messages': 'sms_message',
  'com.gulfos.mail': 'mail',
  'com.gulfos.bank': 'transfer',
  'com.gulfos.identity': 'identity_update',
  'com.gulfos.police': 'police_notice',
  'com.gulfos.ems': 'ems_notice',
  'com.gulfos.justice': 'court_notification',
  'com.gulfos.business': 'company_notification',
  'com.gulfos.security': 'security_alert',
  'com.gulfos.findmy': 'find_my_alert',
  'com.gulfos.calendar': 'calendar_reminder',
  'com.gulfos.notes': 'notes_reminder',
  'com.gulfos.clock': 'alarm_notification',
  'com.gulfos.updates': 'package_update',
};
