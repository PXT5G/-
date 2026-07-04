/** RAM usage in bytes per app */
import { resolveBundleId } from '../utils/bundleIdMigration';

export const APP_RAM_PROFILES: Record<string, { base: number; active: number; background: number; cached: number }> = {
  'com.gulfos.phone': { base: 80_000_000, active: 120_000_000, background: 45_000_000, cached: 25_000_000 },
  'com.gulfos.messages': { base: 60_000_000, active: 90_000_000, background: 35_000_000, cached: 20_000_000 },
  'com.gulfos.contacts': { base: 40_000_000, active: 55_000_000, background: 20_000_000, cached: 12_000_000 },
  'com.gulfos.bank': { base: 100_000_000, active: 180_000_000, background: 60_000_000, cached: 30_000_000 },
  'com.gulfos.police': { base: 200_000_000, active: 350_000_000, background: 120_000_000, cached: 50_000_000 },
  'com.gulfos.poetry': { base: 90_000_000, active: 160_000_000, background: 45_000_000, cached: 25_000_000 },
  'com.gulfos.browser': { base: 120_000_000, active: 220_000_000, background: 60_000_000, cached: 40_000_000 },
  'com.gulfos.chat': { base: 95_000_000, active: 180_000_000, background: 50_000_000, cached: 35_000_000 },
  'com.gulfos.justice': { base: 150_000_000, active: 280_000_000, background: 80_000_000, cached: 40_000_000 },
  'com.gulfos.ems': { base: 180_000_000, active: 320_000_000, background: 90_000_000, cached: 45_000_000 },
  'com.gulfos.camera': { base: 250_000_000, active: 450_000_000, background: 80_000_000, cached: 40_000_000 },
  'com.gulfos.gallery': { base: 120_000_000, active: 220_000_000, background: 50_000_000, cached: 35_000_000 },
  'com.gulfos.settings': { base: 35_000_000, active: 50_000_000, background: 15_000_000, cached: 8_000_000 },
  'com.gulfos.store': { base: 70_000_000, active: 100_000_000, background: 40_000_000, cached: 20_000_000 },
  'com.gulfos.maps': { base: 150_000_000, active: 280_000_000, background: 70_000_000, cached: 40_000_000 },
  'com.gulfos.files': { base: 45_000_000, active: 70_000_000, background: 25_000_000, cached: 15_000_000 },
  'com.gulfos.calendar': { base: 50_000_000, active: 80_000_000, background: 30_000_000, cached: 18_000_000 },
  'com.gulfos.clock': { base: 30_000_000, active: 45_000_000, background: 15_000_000, cached: 10_000_000 },
  'com.gulfos.calculator': { base: 15_000_000, active: 25_000_000, background: 8_000_000, cached: 5_000_000 },
  'com.gulfos.notes': { base: 40_000_000, active: 65_000_000, background: 20_000_000, cached: 12_000_000 },
  'com.gulfos.recorder': { base: 35_000_000, active: 60_000_000, background: 18_000_000, cached: 10_000_000 },
  'com.gulfos.weather': { base: 35_000_000, active: 55_000_000, background: 18_000_000, cached: 10_000_000 },
};

export const DEFAULT_RAM_PROFILE = { base: 50_000_000, active: 80_000_000, background: 25_000_000, cached: 15_000_000 };

export function getAppRamProfile(bundleId: string) {
  const canonical = resolveBundleId(bundleId);
  return APP_RAM_PROFILES[canonical] ?? APP_RAM_PROFILES[bundleId] ?? DEFAULT_RAM_PROFILE;
}

export const DEVICE_GENERATIONS = [
  { id: 'gulf-v1', name: 'Gulf Phone V1', cpu: 'Gulf A17 Pro', gpu: 'Gulf GPU 6-core', ram: 8_000_000_000, battery: 4422, display: '2556×1179' },
  { id: 'gulf-v1-pro', name: 'Gulf Phone V1 Pro', cpu: 'Gulf A17 Pro Max', gpu: 'Gulf GPU 6-core', ram: 8_000_000_000, battery: 4685, display: '2796×1290' },
  { id: 'gulf-v1-pro-max', name: 'Gulf Phone V1 Pro Max', cpu: 'Gulf A17 Pro Max', gpu: 'Gulf GPU 6-core', ram: 8_000_000_000, battery: 5088, display: '2796×1290' },
] as const;

export const DEVICE_COLORS = ['Gold', 'Midnight', 'Silver', 'Deep Purple'] as const;

/** Cache growth rates per app (bytes per tick) */
export const APP_CACHE_GROWTH: Record<string, { category: string; bytesPerHour: number }> = {
  'com.gulfos.phone': { category: 'call_history', bytesPerHour: 120_000 },
  'com.gulfos.messages': { category: 'attachments', bytesPerHour: 450_000 },
  'com.gulfos.camera': { category: 'preview_cache', bytesPerHour: 280_000 },
  'com.gulfos.gallery': { category: 'thumbnails', bytesPerHour: 180_000 },
};

export const LOW_STORAGE_THRESHOLDS = {
  warning: 0.2,
  lowMode: 0.1,
  blockInstall: 0.05,
  emergency: 0.01,
} as const;

export type LowStorageLevel = 'normal' | 'warning' | 'low' | 'critical' | 'emergency';

export function getLowStorageLevel(freeRatio: number): LowStorageLevel {
  if (freeRatio <= LOW_STORAGE_THRESHOLDS.emergency) return 'emergency';
  if (freeRatio <= LOW_STORAGE_THRESHOLDS.blockInstall) return 'critical';
  if (freeRatio <= LOW_STORAGE_THRESHOLDS.lowMode) return 'low';
  if (freeRatio <= LOW_STORAGE_THRESHOLDS.warning) return 'warning';
  return 'normal';
}

/** Photo size by megapixels (approximate JPEG bytes) */
export function estimatePhotoSize(megapixels: number): number {
  return Math.floor(megapixels * 350_000);
}

/** Video size: resolution × fps × duration × codec factor */
export function estimateVideoSize(
  width: number,
  height: number,
  fps: number,
  durationSeconds: number,
  codec: 'h264' | 'hevc' = 'hevc'
): number {
  const pixels = width * height;
  const factor = codec === 'hevc' ? 0.08 : 0.12;
  return Math.floor(pixels * fps * durationSeconds * factor);
}
