import { apiRequest, API_BASE_URL } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type { SystemDashboard, CorePermissionRow, AuditLogRow, RecordedEvent, PlatformSession } from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const controlPanelService = {
  async getDashboard(): Promise<SystemDashboard> {
    const res = await apiRequest<{ success: boolean; data: SystemDashboard }>('/api/control-panel/dashboard', { token: getToken() });
    return res.data!;
  },

  async getPermissions(params?: { appId?: string; userId?: string; page?: number }): Promise<{ permissions: CorePermissionRow[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.appId) qs.set('appId', params.appId);
    if (params?.userId) qs.set('userId', params.userId);
    if (params?.page !== undefined) qs.set('page', String(params.page));
    const res = await apiRequest<{ success: boolean; data: { permissions: CorePermissionRow[]; total: number } }>(`/api/control-panel/permissions?${qs}`, { token: getToken() });
    return res.data!;
  },

  async syncPermissions(appId: string): Promise<{ synced: number }> {
    const res = await apiRequest<{ success: boolean; data: { synced: number } }>('/api/control-panel/permissions/sync', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ appId }),
    });
    return res.data!;
  },

  async grantPermissions(data: { appId: string; userId: string; permissions: string[]; override?: boolean; reason?: string }): Promise<void> {
    await apiRequest('/api/control-panel/permissions/grant', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
  },

  async revokePermission(appId: string, userId: string, permission: string): Promise<void> {
    await apiRequest('/api/control-panel/permissions/revoke', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ appId, userId, permission }),
    });
  },

  async getAuditLogs(params?: { appId?: string; userId?: string; action?: string; search?: string; page?: number }): Promise<{ logs: AuditLogRow[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.appId) qs.set('appId', params.appId);
    if (params?.userId) qs.set('userId', params.userId);
    if (params?.action) qs.set('action', params.action);
    if (params?.search) qs.set('search', params.search);
    if (params?.page !== undefined) qs.set('page', String(params.page));
    const res = await apiRequest<{ success: boolean; data: { logs: AuditLogRow[]; total: number } }>(`/api/control-panel/audit?${qs}`, { token: getToken() });
    return res.data!;
  },

  async exportAudit(params?: { appId?: string; search?: string }): Promise<void> {
    const qs = new URLSearchParams();
    if (params?.appId) qs.set('appId', params.appId);
    if (params?.search) qs.set('search', params.search ?? '');
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/control-panel/audit/export?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bananaos-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async getRealtime(limit = 100): Promise<{ events: RecordedEvent[]; stats: SystemDashboard['eventTraffic']; connectedUserIds: string[] }> {
    const res = await apiRequest<{ success: boolean; data: { events: RecordedEvent[]; stats: SystemDashboard['eventTraffic']; connectedUserIds: string[] } }>(`/api/control-panel/realtime?limit=${limit}`, { token: getToken() });
    return res.data!;
  },

  async getSessions(page = 0, userId?: string): Promise<{ sessions: PlatformSession[]; total: number }> {
    const qs = new URLSearchParams({ page: String(page) });
    if (userId) qs.set('userId', userId);
    const res = await apiRequest<{ success: boolean; data: { sessions: PlatformSession[]; total: number } }>(`/api/control-panel/sessions?${qs}`, { token: getToken() });
    return res.data!;
  },

  async revokeSession(userId: string, sessionId: string, reason?: string): Promise<void> {
    await apiRequest('/api/control-panel/sessions/revoke', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ userId, sessionId, reason }),
    });
  },

  async revokeUser(userId: string, reason?: string): Promise<void> {
    await apiRequest('/api/control-panel/sessions/revoke-user', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ userId, reason }),
    });
  },
};
