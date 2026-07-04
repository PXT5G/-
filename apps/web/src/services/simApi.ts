/**
 * Shared SIM API for Phone, SMS, Contacts, Messenger, Police, Justice apps.
 */
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const simApi = {
  async lookupNumber(number: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: { number: string; status: string; simActive: boolean; userId?: string } }>(
      `/api/sim/numbers/lookup/${encodeURIComponent(number)}`,
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },

  async getCarrierStatus(appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(
      '/api/sim/carrier/status',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },

  async getSignalStatus(appId: string) {
    const res = await apiRequest<{ success: boolean; data: { signalStrength: string; signalBars: number; networkMode: string } }>(
      '/api/sim/signal/status',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },

  async getMyNumber(appId: string) {
    const res = await apiRequest<{ success: boolean; data: { phoneNumber?: string; simStatus: string } }>(
      '/api/sim/dashboard',
      { token: getToken(), headers: { 'X-App-Id': appId } }
    );
    return res.data;
  },
};
