import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';


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
  trash?: number;
  freeRatio?: number;
  lowStorageLevel?: string;
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
    updateReserved?: number;
  };
}

export interface StorageWear {
  healthPercent: number;
  lifetimeWrites: number;
  lifetimeReads: number;
  estimatedRemainingLifeYears: number;
}

export interface RamAppEntry {
  bundleId: string;
  appName: string;
  baseRam: number;
  activeRam: number;
  backgroundRam: number;
  cachedRam: number;
  currentRam: number;
  state: string;
  lastActiveAt: string;
}

export interface RamUsage {
  total: number;
  used: number;
  free: number;
  pressure: number;
  memoryPressure: boolean;
  apps: RamAppEntry[];
}

export interface HardwareProfile {
  deviceName: string;
  deviceModel: string;
  deviceColor: string;
  serialNumber: string;
  deviceUuid: string;
  generation: string;
  cpu: string;
  gpu: string;
  ramTotal: number;
  internalStorage: number;
  capacityTier: string;
  batteryCapacity: number;
  batteryHealth: number;
  batteryLevel: number;
  displayResolution: string;
  osVersion: string;
  buildNumber: string;
  temperature: number;
  uptimeMs: number;
  storageWear: StorageWear;
  lowStorageMode: boolean;
  emergencyMode: boolean;
  lowStorageLevel: string;
  storage?: DeviceStorageBreakdown;
  ram?: RamUsage;
}

export interface LowStorageStatus {
  level: string;
  freeRatio: number;
  freeBytes: number;
  totalBytes: number;
  lowStorageMode: boolean;
  emergencyMode: boolean;
  blockInstall: boolean;
  blockVideoRecording: boolean;
  pauseUpdates: boolean;
  suggestions: string[];
}

export interface TrashInfo {
  items: Array<{
    id: string;
    bundleId: string;
    name: string;
    type: string;
    sizeBytes: number;
    deletedAt: string;
    expiresAt: string;
  }>;
  totalSize: number;
  count: number;
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
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceStorageBreakdown }>(
      '/api/device/storage',
      { token }
    );
    return res.data!;
  },

  async checkInstall(bundleId: string): Promise<{ required: number; available: boolean; free: number }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{
      success: boolean;
      data: { required: number; available: boolean; free: number };
    }>(`/api/device/storage/check/${bundleId}`, { token });
    return res.data!;
  },

  async getLargestApps(): Promise<LargestApp[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: LargestApp[] }>(
      '/api/device/storage/largest-apps',
      { token }
    );
    return res.data ?? [];
  },

  async getPackages(): Promise<InstalledPackageInfo[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: InstalledPackageInfo[] }>(
      '/api/device/storage/packages',
      { token }
    );
    return res.data ?? [];
  },

  async clearAllCache(): Promise<DeviceStorageBreakdown> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceStorageBreakdown }>(
      '/api/device/storage/clear-cache',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async setCapacity(capacity: number): Promise<DeviceStorageBreakdown> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { breakdown: DeviceStorageBreakdown } }>(
      '/api/device/storage/capacity',
      { method: 'PATCH', body: JSON.stringify({ capacity }), token }
    );
    return res.data!.breakdown;
  },

  async getCapacityTiers(): Promise<Array<{ bytes: number; label: string }>> {
    const token = getAccessToken();
    const res = await apiRequest<{ success: boolean; data: Array<{ bytes: number; label: string }> }>(
      '/api/device/storage/capacity-tiers',
      { token }
    );
    return res.data ?? [];
  },

  async getHardware(): Promise<HardwareProfile> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: HardwareProfile }>(
      '/api/device/hardware',
      { token }
    );
    return res.data!;
  },

  async getRam(): Promise<RamUsage> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: RamUsage }>(
      '/api/device/ram',
      { token }
    );
    return res.data!;
  },

  async getTaskManager(): Promise<RamUsage & { tasks: RamAppEntry[] }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: RamUsage & { tasks: RamAppEntry[] } }>(
      '/api/device/task-manager',
      { token }
    );
    return res.data!;
  },

  async launchApp(bundleId: string): Promise<{ allowed: boolean; reason?: string }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { allowed: boolean; reason?: string } }>(
      `/api/device/ram/launch/${bundleId}`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async backgroundApp(bundleId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) return;
    await apiRequest(`/api/device/ram/background/${bundleId}`, { method: 'POST', token });
  },

  async stopApp(bundleId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) return;
    await apiRequest(`/api/device/ram/stop/${bundleId}`, { method: 'POST', token });
  },

  async forceStopApp(bundleId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/device/ram/force-stop/${bundleId}`, { method: 'POST', token });
  },

  async getLowStorageStatus(): Promise<LowStorageStatus> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LowStorageStatus }>(
      '/api/device/low-storage',
      { token }
    );
    return res.data!;
  },

  async getTrash(): Promise<TrashInfo> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: TrashInfo }>(
      '/api/device/trash',
      { token }
    );
    return res.data!;
  },

  async emptyTrash(): Promise<DeviceStorageBreakdown> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { breakdown: DeviceStorageBreakdown } }>(
      '/api/device/trash/empty',
      { method: 'POST', token }
    );
    return res.data!.breakdown;
  },
};

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
