import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const marineService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/marine/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/marine/dashboard', { token });
    return res.data!;
  },

  async getVessel(token: string, params?: Record<string, string | number | boolean>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/marine/vessels?${q}`, { token });
    return res.data!;
  },

  async search(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/search', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getMarinas(token: string, params?: Record<string, string>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, v));
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/marine/marinas?${q}`, { token });
    return res.data!;
  },

  async getMarina(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/marine/marinas/${id}`, { token });
    return res.data!;
  },

  async getDealers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/dealers', { token });
    return res.data!;
  },

  async getAnalytics(token: string, params?: { dealerId?: string; companyId?: string }) {
    const q = new URLSearchParams();
    if (params?.dealerId) q.set('dealerId', params.dealerId);
    if (params?.companyId) q.set('companyId', params.companyId);
    const res = await apiRequest<ApiResponse<unknown>>(`/api/marine/analytics?${q}`, { token });
    return res.data!;
  },

  async getFinance(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/finance', { token });
    return res.data!;
  },

  async getAuctions(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/auctions', { token });
    return res.data!;
  },

  async getOffers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/offers', { token });
    return res.data!;
  },

  async getFavorites(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/marine/favorites', { token });
    return res.data!;
  },

  async toggleFavorite(token: string, vesselId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/marine/vessels/${vesselId}/favorite`, {
      method: 'POST', token,
    });
    return res.data!;
  },
};
