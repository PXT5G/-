import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  SimDashboard,
  SIMProfile,
  PhoneNumberData,
  CallSettingsData,
  SMSSettingsData,
  NetworkData,
  SimNotification,
  AdminStats,
} from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const simService = {
  async initPermissions(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; data: string[] }>('/api/sim/permissions/init', {
      method: 'POST',
      token: getToken(),
    });
    return res.data ?? [];
  },

  async provision(): Promise<SIMProfile> {
    const res = await apiRequest<{ success: boolean; data: SIMProfile }>('/api/sim/provision', {
      method: 'POST',
      token: getToken(),
    });
    return res.data!;
  },

  async getDashboard(): Promise<SimDashboard> {
    const res = await apiRequest<{ success: boolean; data: SimDashboard }>('/api/sim/dashboard', {
      token: getToken(),
    });
    return res.data!;
  },

  async getProfiles(): Promise<SIMProfile[]> {
    const res = await apiRequest<{ success: boolean; data: SIMProfile[] }>('/api/sim/profiles', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async activate(id: string): Promise<void> {
    await apiRequest(`/api/sim/profiles/${id}/activate`, { method: 'POST', token: getToken() });
  },

  async deactivate(id: string, reason?: string): Promise<void> {
    await apiRequest(`/api/sim/profiles/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token: getToken(),
    });
  },

  async suspend(id: string, reason?: string): Promise<void> {
    await apiRequest(`/api/sim/profiles/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token: getToken(),
    });
  },

  async replace(id: string, reason?: string): Promise<void> {
    await apiRequest(`/api/sim/profiles/${id}/replace`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token: getToken(),
    });
  },

  async getNumbers(): Promise<PhoneNumberData[]> {
    const res = await apiRequest<{ success: boolean; data: PhoneNumberData[] }>('/api/sim/numbers', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async reserveNumber(premium = false): Promise<PhoneNumberData> {
    const res = await apiRequest<{ success: boolean; data: PhoneNumberData }>('/api/sim/numbers/reserve', {
      method: 'POST',
      body: JSON.stringify({ premium }),
      token: getToken(),
    });
    return res.data!;
  },

  async releaseNumber(id: string): Promise<void> {
    await apiRequest(`/api/sim/numbers/${id}/release`, { method: 'POST', token: getToken() });
  },

  async changeNumber(simId: string, newNumberId: string): Promise<void> {
    await apiRequest(`/api/sim/profiles/${simId}/change-number`, {
      method: 'POST',
      body: JSON.stringify({ newNumberId }),
      token: getToken(),
    });
  },

  async toggleFavorite(id: string): Promise<void> {
    await apiRequest(`/api/sim/numbers/${id}/favorite`, { method: 'POST', token: getToken() });
  },

  async getNumberHistory() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>('/api/sim/numbers/history', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getCallSettings(): Promise<CallSettingsData> {
    const res = await apiRequest<{ success: boolean; data: CallSettingsData }>('/api/sim/settings/call', {
      token: getToken(),
    });
    return res.data!;
  },

  async updateCallSettings(data: Partial<CallSettingsData>): Promise<void> {
    await apiRequest('/api/sim/settings/call', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: getToken(),
    });
  },

  async getSMSSettings(): Promise<SMSSettingsData> {
    const res = await apiRequest<{ success: boolean; data: SMSSettingsData }>('/api/sim/settings/sms', {
      token: getToken(),
    });
    return res.data!;
  },

  async updateSMSSettings(data: Partial<SMSSettingsData>): Promise<void> {
    await apiRequest('/api/sim/settings/sms', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: getToken(),
    });
  },

  async backupSMS(): Promise<void> {
    await apiRequest('/api/sim/settings/sms/backup', { method: 'POST', token: getToken() });
  },

  async getNetwork(): Promise<NetworkData> {
    const res = await apiRequest<{ success: boolean; data: NetworkData }>('/api/sim/settings/network', {
      token: getToken(),
    });
    return res.data!;
  },

  async updateNetwork(data: Partial<NetworkData>): Promise<void> {
    await apiRequest('/api/sim/settings/network', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: getToken(),
    });
  },

  async runDiagnostic(): Promise<NetworkData> {
    const res = await apiRequest<{ success: boolean; data: NetworkData }>('/api/sim/settings/network/diagnostic', {
      method: 'POST',
      token: getToken(),
    });
    return res.data!;
  },

  async getBlocked() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>('/api/sim/blocked', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async addBlocked(number: string, blockType = 'both') {
    await apiRequest('/api/sim/blocked', {
      method: 'POST',
      body: JSON.stringify({ number, blockType }),
      token: getToken(),
    });
  },

  async removeBlocked(id: string) {
    await apiRequest(`/api/sim/blocked/${id}`, { method: 'DELETE', token: getToken() });
  },

  async getSecurity() {
    const res = await apiRequest<{ success: boolean; data: unknown }>('/api/sim/security', {
      token: getToken(),
    });
    return res.data;
  },

  async setPin(pin: string) {
    await apiRequest('/api/sim/security/pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
      token: getToken(),
    });
  },

  async updateSecurity(data: { biometricEnabled?: boolean; simLocked?: boolean }) {
    await apiRequest('/api/sim/security', {
      method: 'PATCH',
      body: JSON.stringify(data),
      token: getToken(),
    });
  },

  async getNotifications(): Promise<SimNotification[]> {
    const res = await apiRequest<{ success: boolean; data: SimNotification[] }>('/api/sim/notifications', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getAuditLogs() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>('/api/sim/audit', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  // Admin
  async adminStats(): Promise<AdminStats> {
    const res = await apiRequest<{ success: boolean; data: AdminStats }>('/api/sim/admin/stats', {
      token: getToken(),
    });
    return res.data!;
  },

  async adminSearchSims(q?: string) {
    const res = await apiRequest<{ success: boolean; data: SIMProfile[] }>(
      `/api/sim/admin/sims${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async adminSuspend(id: string, reason?: string) {
    await apiRequest(`/api/sim/admin/sims/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token: getToken(),
    });
  },

  async adminActivate(id: string) {
    await apiRequest(`/api/sim/admin/sims/${id}/activate`, { method: 'POST', token: getToken() });
  },

  async adminAuditLogs() {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>('/api/sim/admin/audit', {
      token: getToken(),
    });
    return res.data ?? [];
  },
};
