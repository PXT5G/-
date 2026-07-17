import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const aviationService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/aviation/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/aviation/dashboard', { token });
    return res.data!;
  },

  async getAircraft(token: string, params?: Record<string, string | number | boolean>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/aviation/aircraft?${q}`, { token });
    return res.data!;
  },

  async search(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/search', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getAirports(token: string, params?: Record<string, string>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, v));
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/aviation/airports?${q}`, { token });
    return res.data!;
  },

  async getAirport(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/aviation/airports/${id}`, { token });
    return res.data!;
  },

  async getDealers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/dealers', { token });
    return res.data!;
  },

  async getAnalytics(token: string, params?: { dealerId?: string; companyId?: string }) {
    const q = new URLSearchParams();
    if (params?.dealerId) q.set('dealerId', params.dealerId);
    if (params?.companyId) q.set('companyId', params.companyId);
    const res = await apiRequest<ApiResponse<unknown>>(`/api/aviation/analytics?${q}`, { token });
    return res.data!;
  },

  async getFinance(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/finance', { token });
    return res.data!;
  },

  async getAuctions(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/auctions', { token });
    return res.data!;
  },

  async getOffers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/offers', { token });
    return res.data!;
  },

  async getFavorites(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/aviation/favorites', { token });
    return res.data!;
  },

  async toggleFavorite(token: string, aircraftId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/aviation/aircraft/${aircraftId}/favorite`, {
      method: 'POST', token,
    });
    return res.data!;
  },
};
