import { apiRequest } from '@/utils/api';
import type { OSNotification, ApiResponse } from '@/types';

export const notificationService = {
  async getAll(token: string, unreadOnly = false): Promise<OSNotification[]> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await apiRequest<ApiResponse<OSNotification[]>>(
      `/api/notifications${params}`,
      { token }
    );
    return response.data ?? [];
  },

  async markAsRead(id: string, token: string): Promise<void> {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH', token });
  },

  async markAllAsRead(token: string): Promise<void> {
    await apiRequest('/api/notifications/read-all', { method: 'PATCH', token });
  },

  async delete(id: string, token: string): Promise<void> {
    await apiRequest(`/api/notifications/${id}`, { method: 'DELETE', token });
  },
};
