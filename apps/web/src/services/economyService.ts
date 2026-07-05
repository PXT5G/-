import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const economyService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/economy/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getDashboard(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/economy/dashboard', { token });
    return res.data!;
  },

  async getAnalytics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/economy/analytics', { token });
    return res.data!;
  },

  async getGdpHistory(token: string, limit = 24) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/economy/gdp?limit=${limit}`, { token });
    return res.data!;
  },

  async getInflationHistory(token: string, limit = 24) {
    const res = await apiRequest<ApiResponse<unknown[]>>(`/api/economy/inflation?limit=${limit}`, { token });
    return res.data!;
  },

  async getValuations(token: string, page = 1) {
    const res = await apiRequest<ApiResponse<{ items: unknown[]; total: number }>>(`/api/economy/valuations?page=${page}&limit=20`, { token });
    return res.data!;
  },

  async getReports(token: string) {
    const res = await apiRequest<ApiResponse<{ items: unknown[] }>>('/api/economy/reports?limit=10', { token });
    return res.data!;
  },

  async getBankMetrics(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/economy/bank', { token });
    return res.data!;
  },

  async triggerTick(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/economy/tick', { method: 'POST', token });
    return res.data!;
  },
};
