/** Realistic package sizes in bytes for GULFOS applications */
import { resolveBundleId } from '../utils/bundleIdMigration';

export const APP_PACKAGE_SIZES: Record<string, number> = {
  'com.gulfos.phone': 320_000_000,
  'com.gulfos.messages': 260_000_000,
  'com.gulfos.contacts': 120_000_000,
  'com.gulfos.bank': 480_000_000,
  'com.gulfos.police': 1_400_000_000,
  'com.gulfos.poetry': 520_000_000,
  'com.gulfos.browser': 680_000_000,
  'com.gulfos.chat': 280_000_000,
  'com.gulfos.justice': 950_000_000,
  'com.gulfos.ems': 1_100_000_000,
  'com.gulfos.business': 1_250_000_000,
  'com.gulfos.real-estate': 1_300_000_000,
  'com.gulfos.vehicles': 1_350_000_000,
  'com.gulfos.aviation': 1_400_000_000,
  'com.gulfos.camera': 620_000_000,
  'com.gulfos.gallery': 400_000_000,
  'com.gulfos.identity': 180_000_000,
  'com.gulfos.social': 340_000_000,
  'com.gulfos.calculator': 45_000_000,
  'com.gulfos.maps': 520_000_000,
  'com.gulfos.files': 180_000_000,
  'com.gulfos.calendar': 210_000_000,
  'com.gulfos.clock': 95_000_000,
  'com.gulfos.notes': 150_000_000,
  'com.gulfos.recorder': 120_000_000,
  'com.gulfos.weather': 130_000_000,
  'com.gulfos.store': 280_000_000,
  'com.gulfos.settings': 95_000_000,
  'com.gulfos.sim': 150_000_000,
  'com.gulfos.control-panel': 210_000_000,
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
  const canonical = resolveBundleId(bundleId);
  return APP_PACKAGE_SIZES[canonical] ?? APP_PACKAGE_SIZES[bundleId] ?? fallback;
}

export function formatCapacityLabel(bytes: number): string {
  if (bytes >= 1_000_000_000_000) return `${bytes / 1_000_000_000_000} TB`;
  if (bytes >= 1_000_000_000) return `${bytes / 1_000_000_000} GB`;
  return `${bytes / 1_000_000} MB`;
}
