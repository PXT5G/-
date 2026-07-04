/**
 * Shared Contacts API for Phone, SMS, Messenger, Police, Justice apps.
 */
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const contactsApi = {
  async search(query: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: Array<{ id: string; fullName: string; primaryPhone?: string; avatar?: string }> }>(
      `/api/contacts/search?q=${encodeURIComponent(query)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },

  async getById(id: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(
      `/api/contacts/${id}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },

  async getFavorites(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      '/api/contacts/favorites',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },

  async getEmergency(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      '/api/contacts/emergency',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },

  async lookupByPhone(phone: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(
      `/api/contacts/lookup/phone/${encodeURIComponent(phone)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },

  async getRecent(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      '/api/contacts/recent',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },
};
