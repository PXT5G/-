import { apiRequest } from '@/utils/api';
import type { UserSettings, ApiResponse } from '@/types';

export const settingsService = {
  async get(token: string): Promise<UserSettings> {
    const response = await apiRequest<ApiResponse<UserSettings>>('/api/settings', { token });
    return response.data!;
  },

  async update(partial: Partial<UserSettings>, token: string): Promise<UserSettings> {
    const response = await apiRequest<ApiResponse<UserSettings>>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(partial),
      token,
    });
    return response.data!;
  },

  async reset(token: string): Promise<UserSettings> {
    const response = await apiRequest<ApiResponse<UserSettings>>('/api/settings/reset', {
      method: 'POST',
      token,
    });
    return response.data!;
  },
};
