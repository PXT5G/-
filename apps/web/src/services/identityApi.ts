/**
 * Shared Identity API for BananaOS applications.
 * Bank, Phone, SIM Card, Police, Justice, and future apps use this module
 * to verify identities and request permissions.
 */
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export interface IdentityVerifyResult {
  result: 'success' | 'failed' | 'expired' | 'suspended';
  identity?: {
    id: string;
    fullName: string;
    username: string;
    nationalId: string;
    verified: boolean;
    status: string;
  };
  message: string;
}

export const identityApi = {
  /** Verify identity by QR payload */
  async verifyQr(payload: string, appId: string): Promise<IdentityVerifyResult> {
    const res = await apiRequest<{ success: boolean; data: IdentityVerifyResult }>(
      '/api/identity/verify',
      {
        method: 'POST',
        body: JSON.stringify({ payload, method: 'qr', appId }),
        token: getToken(),
        headers: { 'X-App-Id': appId },
      }
    );
    return res.data!;
  },

  /** Verify identity by barcode value */
  async verifyBarcode(barcode: string, appId: string): Promise<IdentityVerifyResult> {
    const res = await apiRequest<{ success: boolean; data: IdentityVerifyResult }>(
      '/api/identity/verify',
      {
        method: 'POST',
        body: JSON.stringify({ barcode, method: 'barcode', appId }),
        token: getToken(),
        headers: { 'X-App-Id': appId },
      }
    );
    return res.data!;
  },

  /** Verify identity by national ID */
  async verifyNationalId(nationalId: string, appId: string): Promise<IdentityVerifyResult> {
    const res = await apiRequest<{ success: boolean; data: IdentityVerifyResult }>(
      '/api/identity/verify',
      {
        method: 'POST',
        body: JSON.stringify({ nationalId, method: 'api', appId }),
        token: getToken(),
        headers: { 'X-App-Id': appId },
      }
    );
    return res.data!;
  },

  /** Get identity by national ID */
  async getByNationalId(nationalId: string, appId: string) {
    const res = await apiRequest<{ success: boolean; data: unknown }>(
      `/api/identity/${encodeURIComponent(nationalId)}`,
      {
        token: getToken(),
        headers: { 'X-App-Id': appId },
      }
    );
    return res.data;
  },

  /** Search verified identities */
  async search(query: string) {
    const res = await apiRequest<{ success: boolean; data: unknown[] }>(
      `/api/identity/search?q=${encodeURIComponent(query)}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  /** Request permission for an app to access identity data */
  async requestPermission(appId: string, permission: string): Promise<void> {
    await apiRequest('/api/identity/me/permissions', {
      method: 'POST',
      body: JSON.stringify({ appId, permission }),
      token: getToken(),
    });
  },
};
