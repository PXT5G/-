import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const automationAppService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/automation/initialize', { method: 'POST', token });
    return res.data!;
  },
  async list(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/automation', { token });
    return res.data!;
  },
  async create(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/automation', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },
  async activate(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/automation/${id}/activate`, { method: 'POST', token });
    return res.data!;
  },
  async run(token: string, id: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/automation/${id}/run`, { method: 'POST', token });
    return res.data!;
  },
  async getHistory(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/automation/history', { token });
    return res.data!;
  },
};
