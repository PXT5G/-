/** GULF Contacts — com.gulfos.contacts */

export const CONTACTS_APP_BUNDLE = 'com.gulfos.contacts' as const;

export const CONTACT_CATEGORIES = [
  'personal',
  'business',
  'government',
  'police',
  'ems',
  'justice',
  'emergency',
] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_PERMISSIONS = [
  'contacts.access',
  'contacts.create',
  'contacts.edit',
  'contacts.delete',
  'contacts.import',
  'contacts.export',
  'contacts.merge',
  'contacts.block',
  'contacts.share',
] as const;
export type ContactsPermission = (typeof CONTACT_PERMISSIONS)[number];

export const CONTACTS_SOCKET_EVENTS = ['contacts:updated', 'contacts:merged'] as const;
