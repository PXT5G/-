import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const personalizationAppService = {
  async initialize(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/personalization/initialize', { method: 'POST', token }).then((r) => r.data!);
  },
  async themes(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/personalization/themes', { token }).then((r) => r.data!);
  },
  async activateTheme(token: string, id: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/personalization/themes/${id}/activate`, { method: 'POST', token }).then((r) => r.data!);
  },
  async wallpapers(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/personalization/wallpapers', { token }).then((r) => r.data!);
  },
  async layouts(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/personalization/layouts', { token }).then((r) => r.data!);
  },
  async lockScreenProfiles(token: string) {
    return apiRequest<ApiResponse<unknown[]>>('/api/personalization/lock-screen', { token }).then((r) => r.data!);
  },
  async activateLockScreen(token: string, id: string) {
    return apiRequest<ApiResponse<unknown>>(`/api/personalization/lock-screen/${id}/activate`, { method: 'POST', token }).then((r) => r.data!);
  },
  async performance(token: string) {
    return apiRequest<ApiResponse<unknown>>('/api/personalization/performance', { token }).then((r) => r.data!);
  },
};
