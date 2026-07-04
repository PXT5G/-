/**
 * Shared Police API for Justice, Dispatch, and other government apps.
 */
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const policeApi = {
  async lookupCase(caseNumber: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      `/api/police/mdt/cases?q=${encodeURIComponent(caseNumber)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },

  async lookupVehicle(plate: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      `/api/police/mdt/vehicles?q=${encodeURIComponent(plate)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data ?? [];
  },

  async getDepartmentStats(appId: string) {
    const res = await apiRequest<{ success: boolean; data: { officersOnline: number; activeCases: number; activeDispatches: number } }>(
      '/api/police/dashboard',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },
};
