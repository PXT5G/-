import { apiRequest } from '@/utils/api';
import type { InstalledApp, AppManifest, ApiResponse } from '@/types';

export const appService = {
  async getCatalog(token: string): Promise<AppManifest[]> {
    const response = await apiRequest<ApiResponse<AppManifest[]>>('/api/apps/catalog', { token });
    return response.data ?? [];
  },

  async getInstalled(token: string): Promise<InstalledApp[]> {
    const response = await apiRequest<ApiResponse<InstalledApp[]>>('/api/apps/installed', { token });
    return response.data ?? [];
  },

  async install(bundleId: string, token: string, layout?: { pageIndex?: number; position?: { row: number; col: number } }): Promise<InstalledApp> {
    const response = await apiRequest<ApiResponse<InstalledApp>>(`/api/apps/install/${bundleId}`, {
      method: 'POST',
      body: JSON.stringify(layout ?? {}),
      token,
    });
    return response.data!;
  },

  async uninstall(bundleId: string, token: string): Promise<void> {
    await apiRequest(`/api/apps/uninstall/${bundleId}`, { method: 'DELETE', token });
  },

  async updateLayout(
    layout: Array<{ bundleId: string; pageIndex: number; position?: { row: number; col: number }; folderId?: string }>,
    token: string
  ): Promise<void> {
    await apiRequest('/api/apps/layout', {
      method: 'PUT',
      body: JSON.stringify({ layout }),
      token,
    });
  },
};
