/** RAM usage in bytes per app */
export const APP_RAM_PROFILES: Record<string, { base: number; active: number; background: number; cached: number }> = {
  'com.bananaos.phone': { base: 80_000_000, active: 120_000_000, background: 45_000_000, cached: 25_000_000 },
  'com.bananaos.messages': { base: 60_000_000, active: 90_000_000, background: 35_000_000, cached: 20_000_000 },
  'com.bananaos.contacts': { base: 40_000_000, active: 55_000_000, background: 20_000_000, cached: 12_000_000 },
  'com.bananaos.bank': { base: 100_000_000, active: 180_000_000, background: 60_000_000, cached: 30_000_000 },
  'com.bananaos.police': { base: 200_000_000, active: 350_000_000, background: 120_000_000, cached: 50_000_000 },
  'com.bananaos.camera': { base: 250_000_000, active: 450_000_000, background: 80_000_000, cached: 40_000_000 },
  'com.bananaos.gallery': { base: 120_000_000, active: 220_000_000, background: 50_000_000, cached: 35_000_000 },
  'com.bananaos.settings': { base: 35_000_000, active: 50_000_000, background: 15_000_000, cached: 8_000_000 },
  'com.bananaos.store': { base: 70_000_000, active: 100_000_000, background: 40_000_000, cached: 20_000_000 },
};

export const DEFAULT_RAM_PROFILE = { base: 50_000_000, active: 80_000_000, background: 25_000_000, cached: 15_000_000 };

export function getAppRamProfile(bundleId: string) {
  return APP_RAM_PROFILES[bundleId] ?? DEFAULT_RAM_PROFILE;
}

export const DEVICE_GENERATIONS = [
  { id: 'banana-15', name: 'Banana Phone 15', cpu: 'Banana A17 Pro', gpu: 'Banana GPU 6-core', ram: 8_000_000_000, battery: 4422, display: '2556×1179' },
  { id: 'banana-15-pro', name: 'Banana Phone 15 Pro', cpu: 'Banana A17 Pro Max', gpu: 'Banana GPU 6-core', ram: 8_000_000_000, battery: 4685, display: '2796×1290' },
  { id: 'banana-15-pro-max', name: 'Banana Phone 15 Pro Max', cpu: 'Banana A17 Pro Max', gpu: 'Banana GPU 6-core', ram: 8_000_000_000, battery: 5088, display: '2796×1290' },
] as const;

export const DEVICE_COLORS = ['Gold', 'Midnight', 'Silver', 'Deep Purple'] as const;

/** Cache growth rates per app (bytes per tick) */
export const APP_CACHE_GROWTH: Record<string, { category: string; bytesPerHour: number }> = {
  'com.bananaos.phone': { category: 'call_history', bytesPerHour: 120_000 },
  'com.bananaos.messages': { category: 'attachments', bytesPerHour: 450_000 },
  'com.bananaos.camera': { category: 'preview_cache', bytesPerHour: 280_000 },
  'com.bananaos.gallery': { category: 'thumbnails', bytesPerHour: 180_000 },
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
