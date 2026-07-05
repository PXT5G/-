import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const realEstateService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/real-estate/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/real-estate/dashboard', { token });
    return res.data!;
  },

  async getProperties(token: string, params?: Record<string, string | number | boolean>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/real-estate/properties?${q}`, { token });
    return res.data!;
  },

  async getProperty(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/real-estate/properties/${id}`, { token });
    return res.data!;
  },

  async search(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/real-estate/search', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getAnalytics(token: string, params?: { propertyId?: string; companyId?: string }) {
    const q = new URLSearchParams();
    if (params?.propertyId) q.set('propertyId', params.propertyId);
    if (params?.companyId) q.set('companyId', params.companyId);
    const res = await apiRequest<ApiResponse<unknown>>(`/api/real-estate/analytics?${q}`, { token });
    return res.data!;
  },

  async getSales(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/real-estate/sales', { token });
    return res.data!;
  },

  async getRentals(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/real-estate/rentals', { token });
    return res.data!;
  },

  async getOffers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/real-estate/offers', { token });
    return res.data!;
  },

  async getFavorites(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/real-estate/favorites', { token });
    return res.data!;
  },

  async toggleFavorite(token: string, propertyId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/real-estate/properties/${propertyId}/favorite`, {
      method: 'POST', token,
    });
    return res.data!;
  },
};
