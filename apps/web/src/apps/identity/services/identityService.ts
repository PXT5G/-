import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  IdentityData,
  IdentitySettings,
  IdentityPermission,
  IdentitySession,
  TrustedDevice,
  VerificationLogEntry,
  IdentityHistoryEntry,
  IdentityNotification,
  IdentityStats,
  VerifyResult,
  QrData,
  CreateIdentityInput,
  AdminStats,
} from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const identityService = {
  async create(data: CreateIdentityInput): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>('/api/identity', {
      method: 'POST',
      body: JSON.stringify(data),
      token: getToken(),
    });
    return res.data!;
  },

  async getMe(): Promise<IdentityData | null> {
    try {
      const res = await apiRequest<{ success: boolean; data: IdentityData }>('/api/identity/me', {
        token: getToken(),
      });
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  async update(data: Partial<CreateIdentityInput & { photo?: string; banner?: string }>): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>('/api/identity/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: getToken(),
    });
    return res.data!;
  },

  async verify(payload: {
    payload?: string;
    barcode?: string;
    nationalId?: string;
    method?: 'qr' | 'barcode' | 'api';
    appId?: string;
  }): Promise<VerifyResult> {
    const res = await apiRequest<{ success: boolean; data: VerifyResult }>('/api/identity/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
      token: getToken(),
    });
    return res.data!;
  },

  async search(q: string): Promise<Partial<IdentityData>[]> {
    const res = await apiRequest<{ success: boolean; data: Partial<IdentityData>[] }>(
      `/api/identity/search?q=${encodeURIComponent(q)}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getQr(): Promise<QrData> {
    const res = await apiRequest<{ success: boolean; data: QrData }>('/api/identity/me/qr', {
      token: getToken(),
    });
    return res.data!;
  },

  async downloadPdf(): Promise<Blob> {
    const token = getToken();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const response = await fetch(`${API_BASE_URL}/api/identity/me/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('PDF download failed');
    return response.blob();
  },

  async getPermissions(): Promise<IdentityPermission[]> {
    const res = await apiRequest<{ success: boolean; data: IdentityPermission[] }>(
      '/api/identity/me/permissions',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async grantPermission(appId: string, permission: string): Promise<void> {
    await apiRequest('/api/identity/me/permissions', {
      method: 'POST',
      body: JSON.stringify({ appId, permission }),
      token: getToken(),
    });
  },

  async revokePermission(appId: string, permission: string): Promise<void> {
    await apiRequest(`/api/identity/me/permissions/${appId}/${permission}`, {
      method: 'DELETE',
      token: getToken(),
    });
  },

  async getSessions(): Promise<IdentitySession[]> {
    const res = await apiRequest<{ success: boolean; data: IdentitySession[] }>(
      '/api/identity/me/sessions',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    await apiRequest(`/api/identity/me/sessions/${sessionId}`, {
      method: 'DELETE',
      token: getToken(),
    });
  },

  async getSettings(): Promise<IdentitySettings> {
    const res = await apiRequest<{ success: boolean; data: IdentitySettings }>(
      '/api/identity/me/settings',
      { token: getToken() }
    );
    return res.data!;
  },

  async updateSettings(settings: Partial<IdentitySettings>): Promise<IdentitySettings> {
    const res = await apiRequest<{ success: boolean; data: IdentitySettings }>(
      '/api/identity/me/settings',
      { method: 'PATCH', body: JSON.stringify(settings), token: getToken() }
    );
    return res.data!;
  },

  async setPin(pin: string): Promise<void> {
    await apiRequest('/api/identity/me/settings/pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      token: getToken(),
    });
  },

  async verifyPin(pin: string): Promise<boolean> {
    try {
      await apiRequest('/api/identity/me/settings/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
        token: getToken(),
      });
      return true;
    } catch {
      return false;
    }
  },

  async getDevices(): Promise<TrustedDevice[]> {
    const res = await apiRequest<{ success: boolean; data: TrustedDevice[] }>(
      '/api/identity/me/devices',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async addDevice(deviceId: string, deviceName: string): Promise<void> {
    await apiRequest('/api/identity/me/devices', {
      method: 'POST',
      body: JSON.stringify({ deviceId, deviceName, deviceType: 'mobile' }),
      token: getToken(),
    });
  },

  async removeDevice(deviceId: string): Promise<void> {
    await apiRequest(`/api/identity/me/devices/${deviceId}`, {
      method: 'DELETE',
      token: getToken(),
    });
  },

  async getVerificationHistory(): Promise<VerificationLogEntry[]> {
    const res = await apiRequest<{ success: boolean; data: VerificationLogEntry[] }>(
      '/api/identity/me/verification-history',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getHistory(): Promise<IdentityHistoryEntry[]> {
    const res = await apiRequest<{ success: boolean; data: IdentityHistoryEntry[] }>(
      '/api/identity/me/history',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getSecurityLogs(): Promise<{ type: string; action: string; detail?: string; createdAt: string }[]> {
    const res = await apiRequest<{ success: boolean; data: { type: string; action: string; detail?: string; createdAt: string }[] }>(
      '/api/identity/me/security-logs',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async createTempPass(): Promise<{ code: string; expiresAt: string }> {
    const res = await apiRequest<{ success: boolean; data: { code: string; expiresAt: string } }>(
      '/api/identity/me/temp-pass',
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },

  async getNotifications(): Promise<IdentityNotification[]> {
    const res = await apiRequest<{ success: boolean; data: IdentityNotification[] }>(
      '/api/identity/me/notifications',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getStats(): Promise<IdentityStats> {
    const res = await apiRequest<{ success: boolean; data: IdentityStats }>(
      '/api/identity/me/stats',
      { token: getToken() }
    );
    return res.data!;
  },

  async share(): Promise<{ shareText: string; shareUrl: string; nationalId: string; qrPayload: string }> {
    const res = await apiRequest<{ success: boolean; data: { shareText: string; shareUrl: string; nationalId: string; qrPayload: string } }>(
      '/api/identity/me/share',
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },

  // Admin
  async adminQueue(): Promise<IdentityData[]> {
    const res = await apiRequest<{ success: boolean; data: IdentityData[] }>(
      '/api/identity/admin/queue',
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async adminSearch(q: string, status?: string): Promise<IdentityData[]> {
    const params = new URLSearchParams({ q });
    if (status) params.set('status', status);
    const res = await apiRequest<{ success: boolean; data: IdentityData[] }>(
      `/api/identity/admin/search?${params}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async adminStats(): Promise<AdminStats> {
    const res = await apiRequest<{ success: boolean; data: AdminStats }>(
      '/api/identity/admin/stats',
      { token: getToken() }
    );
    return res.data!;
  },

  async adminApprove(id: string): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>(
      `/api/identity/admin/${id}/approve`,
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },

  async adminReject(id: string, reason?: string): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>(
      `/api/identity/admin/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }), token: getToken() }
    );
    return res.data!;
  },

  async adminSuspend(id: string): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>(
      `/api/identity/admin/${id}/suspend`,
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },

  async adminReactivate(id: string): Promise<IdentityData> {
    const res = await apiRequest<{ success: boolean; data: IdentityData }>(
      `/api/identity/admin/${id}/reactivate`,
      { method: 'POST', token: getToken() }
    );
    return res.data!;
  },
};
