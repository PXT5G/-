export const BANANAOS_APP_IDS = {
  IDENTITY: 'com.bananaos.identity',
  BANK: 'com.bananaos.bank',
  SIM: 'com.bananaos.sim',
  CONTACTS: 'com.bananaos.contacts',
  PHONE: 'com.bananaos.phone',
  POLICE: 'com.bananaos.police',
  JUSTICE: 'com.bananaos.justice',
  CONTROL_PANEL: 'com.bananaos.control-panel',
  SETTINGS: 'com.bananaos.settings',
  STORE: 'com.bananaos.store',
} as const;

export type BananaOSAppId = (typeof BANANAOS_APP_IDS)[keyof typeof BANANAOS_APP_IDS];

export const IDENTITY_GATED_APPS: BananaOSAppId[] = [
  BANANAOS_APP_IDS.BANK,
  BANANAOS_APP_IDS.SIM,
  BANANAOS_APP_IDS.PHONE,
  BANANAOS_APP_IDS.POLICE,
  BANANAOS_APP_IDS.JUSTICE,
];
