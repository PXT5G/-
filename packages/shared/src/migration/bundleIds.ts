/**
 * GULFOS bundle ID migration — maps legacy BananaOS identifiers to canonical GULFOS IDs.
 * Use resolveBundleId() at service boundaries so existing DB records and clients keep working.
 */

/** Canonical GULFOS bundle prefix */
export const GULFOS_BUNDLE_PREFIX = 'com.gulfos.' as const;

/** Legacy BananaOS bundle prefix */
export const LEGACY_BUNDLE_PREFIX = 'com.bananaos.' as const;

/** Legacy → canonical bundle ID map */
export const LEGACY_BUNDLE_ID_MAP: Readonly<Record<string, string>> = {
  'com.bananaos.settings': 'com.gulfos.settings',
  'com.bananaos.store': 'com.gulfos.store',
  'com.bananaos.identity': 'com.gulfos.identity',
  'com.bananaos.bank': 'com.gulfos.bank',
  'com.bananaos.sim': 'com.gulfos.sim',
  'com.bananaos.simcard': 'com.gulfos.sim',
  'com.bananaos.contacts': 'com.gulfos.contacts',
  'com.bananaos.police': 'com.gulfos.police',
  'com.bananaos.control-panel': 'com.gulfos.control-panel',
  'com.bananaos.phone': 'com.gulfos.phone',
  'com.bananaos.messages': 'com.gulfos.messages',
  'com.bananaos.maps': 'com.gulfos.maps',
  'com.bananaos.camera': 'com.gulfos.camera',
  'com.bananaos.gallery': 'com.gulfos.gallery',
  'com.bananaos.files': 'com.gulfos.files',
  'com.bananaos.calendar': 'com.gulfos.calendar',
  'com.bananaos.clock': 'com.gulfos.clock',
  'com.bananaos.calculator': 'com.gulfos.calculator',
  'com.bananaos.notes': 'com.gulfos.notes',
  'com.bananaos.voicerecorder': 'com.gulfos.recorder',
  'com.bananaos.weather': 'com.gulfos.weather',
  'com.bananaos.social': 'com.gulfos.social',
  'com.bananaos.justice': 'com.gulfos.justice',
  'com.bananaos.browser': 'com.gulfos.browser',
  'com.bananaos.vpn': 'com.gulfos.vpn',
  'com.bananaos.system': 'com.gulfos.system',
  'com.bananaos.communication': 'com.gulfos.communication',
  'com.bananaos.search': 'com.gulfos.search',
};

const REVERSE_BUNDLE_ID_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LEGACY_BUNDLE_ID_MAP).map(([legacy, canonical]) => [canonical, legacy])
);

/** Resolve a bundle ID to its canonical GULFOS form */
export function resolveBundleId(bundleId: string): string {
  if (!bundleId) return bundleId;
  if (bundleId in LEGACY_BUNDLE_ID_MAP) {
    return LEGACY_BUNDLE_ID_MAP[bundleId]!;
  }
  if (bundleId.startsWith(LEGACY_BUNDLE_PREFIX)) {
    return bundleId.replace(LEGACY_BUNDLE_PREFIX, GULFOS_BUNDLE_PREFIX);
  }
  return bundleId;
}

/** All bundle IDs that should match a canonical ID (legacy + canonical) */
export function bundleIdVariants(bundleId: string): string[] {
  const canonical = resolveBundleId(bundleId);
  const legacy = REVERSE_BUNDLE_ID_MAP[canonical];
  return legacy && legacy !== canonical ? [canonical, legacy] : [canonical];
}

/** MongoDB filter helper — matches legacy or canonical bundle ID */
export function bundleIdQuery(bundleId: string): { $in: string[] } {
  return { $in: bundleIdVariants(bundleId) };
}

/** Returns true if two bundle IDs refer to the same app */
export function isSameBundleId(a: string, b: string): boolean {
  return resolveBundleId(a) === resolveBundleId(b);
}
