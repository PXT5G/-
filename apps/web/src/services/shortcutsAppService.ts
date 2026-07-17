import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const shortcutsAppService = {
  async initialize(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/shortcuts/initialize', { method: 'POST', token }).then((r) => r.data!);
  },
  async list(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/shortcuts', { token }).then((r) => r.data!);
  },
  async run(token: string, id: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/shortcuts/${id}/run`, { method: 'POST', token }).then((r) => r.data!);
  },
  async create(token: string, body: Record<string, unknown>) {
    return apiRequest<ApiResponse<unknown>>('/api/shortcuts', { method: 'POST', token, body: JSON.stringify(body) }).then((r) => r.data!);
  },
  async history(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/shortcuts/history', { token }).then((r) => r.data!);
  },
};
