import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const focusAppService = {
  async initialize(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/focus/initialize', { method: 'POST', token }).then((r) => r.data!);
  },
  async list(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/focus', { token }).then((r) => r.data!);
  },
  async active(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/focus/active', { token }).then((r) => r.data!);
  },
  async enable(token: string, id: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/focus/${id}/enable`, { method: 'POST', token }).then((r) => r.data!);
  },
  async disable(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/focus/disable', { method: 'POST', token }).then((r) => r.data!);
  },
};
