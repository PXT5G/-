/**
 * Shared Phone API for cross-app integrations.
 */
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const phoneApi = {
  async getDashboard(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>('/api/phone/dashboard', {
      token: getToken(),
      headers: { 'X-App-Id': appId },
    });
    return res.data;
  },

  async getActiveCall(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>('/api/phone/calls/active', {
      token: getToken(),
      headers: { 'X-App-Id': appId },
    });
    return res.data;
  },

  async lookupNumber(phone: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      `/api/phone/contacts/search?q=${encodeURIComponent(phone)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },
};
