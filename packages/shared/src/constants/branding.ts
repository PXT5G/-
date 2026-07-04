/** GULFOS global branding constants */

export const GULFOS_BRANDING = {
  osName: 'GULFOS',
  osDisplayName: 'GULFOS',
  company: 'Gulf Technologies',
  developer: 'Abu Sharaf',
  device: 'Gulf Phone V1',
  carrier: 'GULF Mobile',
  coreServices: 'GULF Core',
  store: 'GULF Store',
  osVersion: '1.0.0',
} as const;

/** Legacy branding strings for migration / display fallbacks */
export const LEGACY_BRANDING_ALIASES: Readonly<Record<string, string>> = {
  BananaOS: GULFOS_BRANDING.osName,
  'Banana Technologies': GULFOS_BRANDING.company,
  'Banana Mobile': GULFOS_BRANDING.carrier,
  'Banana Core': GULFOS_BRANDING.coreServices,
  'Banana App': GULFOS_BRANDING.store,
};
