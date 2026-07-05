import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const vehicleService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/vehicles/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/vehicles/dashboard', { token });
    return res.data!;
  },

  async getVehicles(token: string, params?: Record<string, string | number | boolean>) {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/vehicles/vehicles?${q}`, { token });
    return res.data!;
  },

  async getVehicle(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/vehicles/vehicles/${id}`, { token });
    return res.data!;
  },

  async search(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/search', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getDealers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/dealers', { token });
    return res.data!;
  },

  async getDealerInventory(token: string, dealerId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/vehicles/dealers/${dealerId}/inventory`, { token });
    return res.data!;
  },

  async getAnalytics(token: string, params?: { dealerId?: string; companyId?: string }) {
    const q = new URLSearchParams();
    if (params?.dealerId) q.set('dealerId', params.dealerId);
    if (params?.companyId) q.set('companyId', params.companyId);
    const res = await apiRequest<ApiResponse<unknown>>(`/api/vehicles/analytics?${q}`, { token });
    return res.data!;
  },

  async getFinance(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/finance', { token });
    return res.data!;
  },

  async getAuctions(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/auctions', { token });
    return res.data!;
  },

  async getSales(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/sales', { token });
    return res.data!;
  },

  async getOffers(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/offers', { token });
    return res.data!;
  },

  async getFavorites(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/vehicles/favorites', { token });
    return res.data!;
  },

  async toggleFavorite(token: string, vehicleId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/vehicles/vehicles/${vehicleId}/favorite`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async getCategories(token: string) {
    const res = await apiRequest<ApiResponse<string[]>>('/api/vehicles/categories', { token });
    return res.data!;
  },
};
