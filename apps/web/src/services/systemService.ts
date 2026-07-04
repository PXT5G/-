import { apiRequest } from '@/utils/api';
import type {
  DeviceLocationState,
  NetworkStateSnapshot,
  DeviceStateSnapshot,
  BackgroundJobInfo,
  DiagnosticsReport,
  SystemEventInfo,
  SystemPermissionType,
} from '@/types';

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

export const systemService = {
  async initialize(): Promise<{ ready: boolean; services: string[] }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { ready: boolean; services: string[] } }>(
      '/api/system/ready',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getLocation(appId?: string): Promise<DeviceLocationState> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const qs = appId ? `?appId=${encodeURIComponent(appId)}` : '';
    const res = await apiRequest<{ success: boolean; data: DeviceLocationState }>(
      `/api/system/location${qs}`,
      { token }
    );
    return res.data!;
  },

  async setLocationEnabled(enabled: boolean): Promise<DeviceLocationState> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceLocationState }>(
      '/api/system/location',
      { method: 'PATCH', body: JSON.stringify({ enabled }), token }
    );
    return res.data!;
  },

  async getNetwork(): Promise<NetworkStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: NetworkStateSnapshot }>(
      '/api/system/network',
      { token }
    );
    return res.data!;
  },

  async updateNetwork(updates: Partial<NetworkStateSnapshot>): Promise<NetworkStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: NetworkStateSnapshot }>(
      '/api/system/network',
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },

  async getDeviceState(): Promise<DeviceStateSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DeviceStateSnapshot }>(
      '/api/system/device',
      { token }
    );
    return res.data!;
  },

  async getJobs(): Promise<BackgroundJobInfo[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BackgroundJobInfo[] }>(
      '/api/system/jobs',
      { token }
    );
    return res.data ?? [];
  },

  async cancelJob(id: string): Promise<BackgroundJobInfo> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: BackgroundJobInfo }>(
      `/api/system/jobs/${id}/cancel`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getPermissions(appId?: string): Promise<Array<{ appId: string; permission: string; granted: boolean }>> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const qs = appId ? `?appId=${encodeURIComponent(appId)}` : '';
    const res = await apiRequest<{ success: boolean; data: Array<{ appId: string; permission: string; granted: boolean }> }>(
      `/api/system/permissions${qs}`,
      { token }
    );
    return res.data ?? [];
  },

  async grantPermission(appId: string, permission: SystemPermissionType): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest('/api/system/permissions/grant', {
      method: 'POST',
      body: JSON.stringify({ appId, permission }),
      token,
    });
  },

  async revokePermission(appId: string, permission: SystemPermissionType): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest('/api/system/permissions/revoke', {
      method: 'POST',
      body: JSON.stringify({ appId, permission }),
      token,
    });
  },

  async getDiagnostics(): Promise<DiagnosticsReport> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DiagnosticsReport }>(
      '/api/system/diagnostics',
      { token }
    );
    return res.data!;
  },

  async collectDiagnostics(): Promise<DiagnosticsReport> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: DiagnosticsReport }>(
      '/api/system/diagnostics/collect',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async replayEvents(params?: { namespace?: string; limit?: number }): Promise<SystemEventInfo[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const qs = new URLSearchParams();
    if (params?.namespace) qs.set('namespace', params.namespace);
    if (params?.limit) qs.set('limit', String(params.limit));
    const res = await apiRequest<{ success: boolean; data: SystemEventInfo[] }>(
      `/api/system/events/replay?${qs}`,
      { token }
    );
    return res.data ?? [];
  },

  async getBackgroundTasks(): Promise<string[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: string[] }>(
      '/api/system/diagnostics/tasks',
      { token }
    );
    return res.data ?? [];
  },
};
