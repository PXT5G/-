import { apiRequest } from '@/utils/api';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('bananaos_bananaos-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.accessToken;
    }
  } catch { /* ignore */ }
  return undefined;
}

export interface DeviceStorageBreakdown {
  total: number;
  used: number;
  free: number;
  system: number;
  apps: number;
  cache: number;
  photosVideos: number;
  documents: number;
  downloads: number;
  messages: number;
  audio: number;
  other: number;
  reserved: number;
  capacityTier?: string;
  deviceName?: string;
  osVersion?: string;
  buildNumber?: string;
  systemBreakdown?: {
    operatingSystem: number;
    systemFiles: number;
    logs: number;
    updates: number;
    recovery: number;
    reservedSpace: number;
  };
}

export interface InstalledPackageInfo {
  bundleId: string;
  packageId: string;
  version: string;
  buildNumber: string;
  size: number;
  installedSize: number;
  cacheSize: number;
  dataSize: number;
  developer: string;
  permissions: string[];
  dependencies: string[];
  installDate: string;
  lastUpdate: string;
  digitalSignature: string;
}

export interface LargestApp {
  bundleId: string;
  name: string;
  icon: string;
  storageBytes: number;
  installedVersion: string;
  installedAt: string;
}

export const deviceStorageService = {
  async getStorage(): Promise<DeviceStorageBreakdown> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceStorageBreakdown }>(
      '/api/device/storage',
      { token }
    );
    return res.data!;
  },

  async checkInstall(bundleId: string): Promise<{ required: number; available: boolean; free: number }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{
      success: boolean;
      data: { required: number; available: boolean; free: number };
    }>(`/api/device/storage/check/${bundleId}`, { token });
    return res.data!;
  },

  async getLargestApps(): Promise<LargestApp[]> {
    const token = getToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: LargestApp[] }>(
      '/api/device/storage/largest-apps',
      { token }
    );
    return res.data ?? [];
  },

  async getPackages(): Promise<InstalledPackageInfo[]> {
    const token = getToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: InstalledPackageInfo[] }>(
      '/api/device/storage/packages',
      { token }
    );
    return res.data ?? [];
  },

  async clearAllCache(): Promise<DeviceStorageBreakdown> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceStorageBreakdown }>(
      '/api/device/storage/clear-cache',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async setCapacity(capacity: number): Promise<DeviceStorageBreakdown> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { breakdown: DeviceStorageBreakdown } }>(
      '/api/device/storage/capacity',
      { method: 'PATCH', body: JSON.stringify({ capacity }), token }
    );
    return res.data!.breakdown;
  },

  async getCapacityTiers(): Promise<Array<{ bytes: number; label: string }>> {
    const token = getToken();
    const res = await apiRequest<{ success: boolean; data: Array<{ bytes: number; label: string }> }>(
      '/api/device/storage/capacity-tiers',
      { token }
    );
    return res.data ?? [];
  },
};

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}
