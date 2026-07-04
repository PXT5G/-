/** Realistic package sizes in bytes for BananaOS applications */
export const APP_PACKAGE_SIZES: Record<string, number> = {
  'com.bananaos.phone': 320_000_000,
  'com.bananaos.messages': 260_000_000,
  'com.bananaos.contacts': 120_000_000,
  'com.bananaos.bank': 480_000_000,
  'com.bananaos.police': 1_400_000_000,
  'com.bananaos.justice': 950_000_000,
  'com.bananaos.camera': 620_000_000,
  'com.bananaos.gallery': 400_000_000,
  'com.bananaos.identity': 180_000_000,
  'com.bananaos.social': 340_000_000,
  'com.bananaos.calculator': 45_000_000,
  'com.bananaos.store': 280_000_000,
  'com.bananaos.settings': 95_000_000,
  'com.bananaos.sim': 150_000_000,
  'com.bananaos.control-panel': 210_000_000,
};

export const STORAGE_CAPACITY_TIERS = [
  32_000_000_000,
  64_000_000_000,
  128_000_000_000,
  256_000_000_000,
  512_000_000_000,
  1_000_000_000_000,
] as const;

export type StorageCapacityTier = (typeof STORAGE_CAPACITY_TIERS)[number];

export const DEFAULT_CAPACITY: StorageCapacityTier = 128_000_000_000;

export function getAppPackageSize(bundleId: string, fallback = 80_000_000): number {
  return APP_PACKAGE_SIZES[bundleId] ?? fallback;
}

export function formatCapacityLabel(bytes: number): string {
  if (bytes >= 1_000_000_000_000) return `${bytes / 1_000_000_000_000} TB`;
  if (bytes >= 1_000_000_000) return `${bytes / 1_000_000_000} GB`;
  return `${bytes / 1_000_000} MB`;
}
