import { apiRequest } from '@/utils/api';
import type {
  BatteryStateSnapshot,
  PerformanceStateSnapshot,
  PhonePowerStateSnapshot,
  LiveActivitySnapshot,
  ControlCenterConfigSnapshot,
  LockScreenConfigSnapshot,
  StatusBarConfigSnapshot,
  GlobalSearchResult,
} from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.accessToken;
    }
  } catch { /* ignore */ }
  return undefined;
}

export interface PhoneOsConfigs {
  controlCenter: ControlCenterConfigSnapshot;
  lockScreen: LockScreenConfigSnapshot;
  statusBar: StatusBarConfigSnapshot;
  wallpaper: Record<string, unknown>;
  widgetLayout: Record<string, unknown>;
  notificationPreferences: Record<string, unknown>;
  accessibility: Record<string, unknown>;
}

export interface PhoneDeviceInfo {
  profile: Record<string, unknown>;
  power: PhonePowerStateSnapshot;
  battery: BatteryStateSnapshot;
  performance: PerformanceStateSnapshot;
  deviceState: Record<string, unknown>;
  configs: PhoneOsConfigs;
}

export const phoneOsService = {
  async initialize(): Promise<PhoneDeviceInfo> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PhoneDeviceInfo }>(
      '/api/device/phone/initialize',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getInfo(): Promise<PhoneDeviceInfo> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PhoneDeviceInfo }>(
      '/api/device/phone/info',
      { token }
    );
    return res.data!;
  },

  async powerAction(action: 'power_on' | 'power_off' | 'restart' | 'emergency_restart'): Promise<PhonePowerStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PhonePowerStateSnapshot }>(
      '/api/device/phone/power',
      { method: 'POST', body: JSON.stringify({ action }), token }
    );
    return res.data!;
  },

  async startCharging(chargingType: 'wired' | 'fast' | 'wireless' = 'wired'): Promise<BatteryStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BatteryStateSnapshot }>(
      '/api/device/phone/charging/start',
      { method: 'POST', body: JSON.stringify({ chargingType }), token }
    );
    return res.data!;
  },

  async stopCharging(): Promise<BatteryStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BatteryStateSnapshot }>(
      '/api/device/phone/charging/stop',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getBattery(): Promise<BatteryStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BatteryStateSnapshot }>(
      '/api/device/phone/battery',
      { token }
    );
    return res.data!;
  },

  async getPerformance(): Promise<PerformanceStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PerformanceStateSnapshot }>(
      '/api/device/phone/performance',
      { token }
    );
    return res.data!;
  },

  async setPerformanceMode(
    mode: 'normal' | 'balanced' | 'performance' | 'power_saving' | 'ultra_power_saving'
  ): Promise<PerformanceStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PerformanceStateSnapshot }>(
      '/api/device/phone/performance/mode',
      { method: 'PATCH', body: JSON.stringify({ mode }), token }
    );
    return res.data!;
  },

  async getDiagnostics(): Promise<Record<string, unknown>> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Record<string, unknown> }>(
      '/api/device/phone/diagnostics',
      { token }
    );
    return res.data!;
  },

  async getConfigs(): Promise<PhoneOsConfigs> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PhoneOsConfigs }>(
      '/api/device/phone/configs',
      { token }
    );
    return res.data!;
  },

  async getLiveActivities(): Promise<LiveActivitySnapshot[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LiveActivitySnapshot[] }>(
      '/api/device/phone/live-activities',
      { token }
    );
    return res.data!;
  },

  async createLiveActivity(input: {
    type: string;
    title: string;
    subtitle?: string;
    icon?: string;
    progress?: number;
    appId: string;
    payload?: Record<string, unknown>;
  }): Promise<LiveActivitySnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LiveActivitySnapshot }>(
      '/api/device/phone/live-activities',
      { method: 'POST', body: JSON.stringify(input), token }
    );
    return res.data!;
  },

  async updateLiveActivity(
    activityId: string,
    updates: Partial<{ title: string; subtitle: string; progress: number; state: string }>
  ): Promise<LiveActivitySnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LiveActivitySnapshot }>(
      `/api/device/phone/live-activities/${activityId}`,
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },

  async endLiveActivity(activityId: string): Promise<LiveActivitySnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LiveActivitySnapshot }>(
      `/api/device/phone/live-activities/${activityId}/end`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async globalSearch(q: string, categories?: string[]): Promise<{
    query: string;
    results: GlobalSearchResult[];
    total: number;
    categories: Record<string, number>;
  }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const params = new URLSearchParams({ q });
    if (categories?.length) params.set('categories', categories.join(','));
    const res = await apiRequest<{
      success: boolean;
      data: { query: string; results: GlobalSearchResult[]; total: number; categories: Record<string, number> };
    }>(`/api/system/search?${params.toString()}`, { token });
    return res.data!;
  },

  async freezeBackgroundApp(bundleId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/device/phone/background/${bundleId}/freeze`, { method: 'POST', token });
  },

  async pinBackgroundApp(bundleId: string, pinned: boolean): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/device/phone/background/${bundleId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
      token,
    });
  },

  async updateLockScreen(updates: Partial<LockScreenConfigSnapshot>): Promise<LockScreenConfigSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: LockScreenConfigSnapshot }>(
      '/api/device/phone/configs/lock-screen',
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },
};
