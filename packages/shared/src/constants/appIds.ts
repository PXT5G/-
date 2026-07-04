/** Canonical GULFOS application bundle identifiers */

export const GULFOS_APP_IDS = {
  IDENTITY: 'com.gulfos.identity',
  BANK: 'com.gulfos.bank',
  SIM: 'com.gulfos.sim',
  CONTACTS: 'com.gulfos.contacts',
  PHONE: 'com.gulfos.phone',
  MESSAGES: 'com.gulfos.messages',
  CHAT: 'com.gulfos.chat',
  POLICE: 'com.gulfos.police',
  POETRY: 'com.gulfos.poetry',
  JUSTICE: 'com.gulfos.justice',
  EMS: 'com.gulfos.ems',
  BUSINESS: 'com.gulfos.business',
  REAL_ESTATE: 'com.gulfos.real-estate',
  VEHICLES: 'com.gulfos.vehicles',
  CONTROL_PANEL: 'com.gulfos.control-panel',
  SETTINGS: 'com.gulfos.settings',
  STORE: 'com.gulfos.store',
  MAPS: 'com.gulfos.maps',
  CAMERA: 'com.gulfos.camera',
  GALLERY: 'com.gulfos.gallery',
  FILES: 'com.gulfos.files',
  CALENDAR: 'com.gulfos.calendar',
  CLOCK: 'com.gulfos.clock',
  CALCULATOR: 'com.gulfos.calculator',
  NOTES: 'com.gulfos.notes',
  RECORDER: 'com.gulfos.recorder',
  WEATHER: 'com.gulfos.weather',
  SOCIAL: 'com.gulfos.social',
  BROWSER: 'com.gulfos.browser',
  VPN: 'com.gulfos.vpn',
  SYSTEM: 'com.gulfos.system',
  COMMUNICATION: 'com.gulfos.communication',
} as const;

export type GULFOSAppId = (typeof GULFOS_APP_IDS)[keyof typeof GULFOS_APP_IDS];

export const IDENTITY_GATED_APPS: GULFOSAppId[] = [
  GULFOS_APP_IDS.BANK,
  GULFOS_APP_IDS.SIM,
  GULFOS_APP_IDS.POLICE,
];

/** @deprecated Use GULFOS_APP_IDS — kept for migration compatibility */
export const BANANAOS_APP_IDS = GULFOS_APP_IDS;

/** @deprecated Use GULFOSAppId */
export type BananaOSAppId = GULFOSAppId;
