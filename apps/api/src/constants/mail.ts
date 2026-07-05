/** GULF Mail — com.gulfos.mail */

export const MAIL_APP_BUNDLE = 'com.gulfos.mail' as const;

export const MAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'] as const;
export type MailFolder = (typeof MAIL_FOLDERS)[number];

export const MAIL_PERMISSIONS = [
  'mail.access',
  'mail.send',
  'mail.receive',
  'mail.delete',
  'mail.rules',
  'mail.attachments',
  'mail.schedule',
] as const;
export type MailPermission = (typeof MAIL_PERMISSIONS)[number];

export const MAIL_SOCKET_EVENTS = ['mail:new', 'mail:updated', 'mail:sync'] as const;
