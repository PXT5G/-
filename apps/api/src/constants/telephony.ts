/** GULF Phone & Call Engine — com.gulfos.phone */

export const PHONE_APP_BUNDLE = 'com.gulfos.phone' as const;

export const CALL_DIRECTIONS = ['incoming', 'outgoing'] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];

export const CALL_STATUSES = [
  'ringing',
  'connecting',
  'connected',
  'on_hold',
  'ended',
  'missed',
  'rejected',
  'busy',
  'cancelled',
  'failed',
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const CALL_TYPES = ['voice', 'video', 'conference', 'emergency'] as const;
export type CallType = (typeof CALL_TYPES)[number];

export const AUDIO_ROUTES = ['earpiece', 'speaker', 'bluetooth', 'wired'] as const;
export type AudioRoute = (typeof AUDIO_ROUTES)[number];

export const EMERGENCY_NUMBERS = ['911', '999', '112', '000'] as const;

export const GOVERNMENT_DIRECTORY = [
  { number: '911', label: 'Emergency (911)', category: 'emergency' },
  { number: 'POLICE', label: 'Police Direct', category: 'police' },
  { number: 'EMS', label: 'EMS Direct', category: 'ems' },
  { number: 'JUSTICE', label: 'Justice Hotline', category: 'justice' },
] as const;

export const PHONE_PERMISSIONS = [
  'phone.access',
  'phone.call',
  'phone.video',
  'phone.conference',
  'phone.record',
  'phone.voicemail',
  'phone.block',
  'phone.emergency',
  'phone.export',
  'phone.analytics',
] as const;
export type PhonePermission = (typeof PHONE_PERMISSIONS)[number];

export const PHONE_SOCKET_EVENTS = [
  'phone:incoming',
  'phone:connected',
  'phone:ended',
  'phone:status',
  'phone:voicemail',
] as const;
