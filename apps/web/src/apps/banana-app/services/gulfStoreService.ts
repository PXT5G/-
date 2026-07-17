'use client';

import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';
import type {
  StoreApp,
  StoreCategory,
  StoreDeveloper,
  InstalledStoreApp,
  StoreDownload,
  StoreSettings,
  PackageManifest,
  RegistryEntry,
  AppStorageInfo,
} from '../types';

export const gulfStoreService = {
  async getFeatured(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/featured', {
      token: getAccessToken(),
    });
    return res.data ?? [];
  },

  async getTrending(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/trending', {
      token: getAccessToken(),
    });
    return res.data ?? [];
  },

  async getRecommended(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/recommended', {
      token: getAccessToken(),
    });
    return res.data ?? [];
  },

  async getEditorsChoice(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/editors-choice', {
      token: getAccessToken(),
    });
    return res.data ?? [];
  },

  async getCategories(): Promise<StoreCategory[]> {
    const res = await apiRequest<{ success: boolean; data: StoreCategory[] }>('/api/store/categories');
    return res.data ?? [];
  },

  async getByCategory(category: string): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>(
      `/api/store/categories/${category}`,
      { token: getAccessToken() }
    );
    return res.data ?? [];
  },

  async search(q: string, sort = 'relevance'): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>(
      `/api/store/search?q=${encodeURIComponent(q)}&sort=${sort}`,
      { token: getAccessToken() }
    );
    return res.data ?? [];
  },

  async getAppDetail(bundleId: string): Promise<StoreApp> {
    const res = await apiRequest<{ success: boolean; data: StoreApp }>(
      `/api/store/apps/${bundleId}`,
      { token: getAccessToken() }
    );
    return res.data!;
  },

  async getPackageManifest(bundleId: string, version?: string): Promise<{ manifest: PackageManifest; storageRequired: number }> {
    const qs = version ? `?version=${encodeURIComponent(version)}` : '';
    const res = await apiRequest<{ success: boolean; data: { manifest: PackageManifest; storageRequired: number } }>(
      `/api/store/apps/${bundleId}/manifest${qs}`,
      { token: getAccessToken() }
    );
    return res.data!;
  },

  async getDeveloper(slug: string): Promise<StoreDeveloper> {
    const res = await apiRequest<{ success: boolean; data: StoreDeveloper }>(
      `/api/store/developers/${slug}`
    );
    return res.data!;
  },

  async postReview(bundleId: string, review: { rating: number; title: string; body: string }): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/apps/${bundleId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
      token,
    });
  },

  async install(bundleId: string, approvedPermissions: string[]): Promise<{ downloadId: string }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { downloadId: string } }>(
      `/api/store/apps/${bundleId}/install`,
      { method: 'POST', body: JSON.stringify({ approvedPermissions }), token }
    );
    return res.data!;
  },

  async completeInstall(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/complete`, { method: 'POST', token });
  },

  async uninstall(
    bundleId: string,
    options: { keepUserData?: boolean; keepSettings?: boolean; keepSession?: boolean; keepData?: boolean } = {}
  ): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/apps/${bundleId}/uninstall`, {
      method: 'DELETE',
      body: JSON.stringify({
        keepUserData: options.keepUserData ?? options.keepData ?? false,
        keepSettings: options.keepSettings ?? false,
        keepSession: options.keepSession ?? false,
      }),
      token,
    });
  },

  async update(bundleId: string, approvedPermissions: string[]): Promise<{ downloadId: string }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { downloadId: string } }>(
      `/api/store/apps/${bundleId}/update`,
      { method: 'POST', body: JSON.stringify({ approvedPermissions }), token }
    );
    return res.data!;
  },

  async completeUpdate(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/complete-update`, { method: 'POST', token });
  },

  async pauseDownload(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/pause`, { method: 'POST', token });
  },

  async resumeDownload(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/resume`, { method: 'POST', token });
  },

  async cancelDownload(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/cancel`, { method: 'POST', token });
  },

  async retryDownload(downloadId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/retry`, { method: 'POST', token });
  },

  async getDownloadQueue(): Promise<StoreDownload[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: StoreDownload[] }>(
      '/api/store/downloads/queue',
      { token }
    );
    return res.data ?? [];
  },

  async getInstalled(): Promise<{ apps: InstalledStoreApp[]; registry: RegistryEntry[] }> {
    const token = getAccessToken();
    if (!token) return { apps: [], registry: [] };
    const res = await apiRequest<{ success: boolean; data: InstalledStoreApp[]; registry: RegistryEntry[] }>(
      '/api/store/installed',
      { token }
    );
    return { apps: res.data ?? [], registry: res.registry ?? [] };
  },

  async getRegistry(): Promise<RegistryEntry[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: RegistryEntry[] }>(
      '/api/store/registry',
      { token }
    );
    return res.data ?? [];
  },

  async getAppStorage(bundleId: string): Promise<AppStorageInfo> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: AppStorageInfo }>(
      `/api/store/apps/${bundleId}/storage`,
      { token }
    );
    return res.data!;
  },

  async clearCache(bundleId: string): Promise<AppStorageInfo> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: AppStorageInfo }>(
      `/api/store/apps/${bundleId}/clear-cache`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async clearData(bundleId: string): Promise<AppStorageInfo> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: AppStorageInfo }>(
      `/api/store/apps/${bundleId}/clear-data`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getChangelog(bundleId: string, from: string, to: string): Promise<string> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { changelog: string } }>(
      `/api/store/apps/${bundleId}/changelog?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { token }
    );
    return res.data?.changelog ?? '';
  },

  async getDownloads(): Promise<StoreDownload[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: StoreDownload[] }>(
      '/api/store/downloads',
      { token }
    );
    return res.data ?? [];
  },

  async getUpdates(): Promise<InstalledStoreApp[]> {
    const token = getAccessToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: InstalledStoreApp[] }>(
      '/api/store/updates',
      { token }
    );
    return res.data ?? [];
  },

  async getSettings(): Promise<StoreSettings> {
    const token = getAccessToken();
    if (!token) return { autoUpdate: true, cellularDownloads: false, notifyUpdates: true };
    const res = await apiRequest<{ success: boolean; data: StoreSettings }>(
      '/api/store/settings',
      { token }
    );
    return res.data!;
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: StoreSettings }>(
      '/api/store/settings',
      { method: 'PATCH', body: JSON.stringify(settings), token }
    );
    return res.data!;
  },

  async seedStore(): Promise<void> {
    const token = getAccessToken();
    await apiRequest('/api/store/seed', { method: 'POST', token });
  },
};
