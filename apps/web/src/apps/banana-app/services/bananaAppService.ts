import { apiRequest } from '@/utils/api';
import type {
  StoreApp,
  StoreCategory,
  StoreDeveloper,
  InstalledStoreApp,
  StoreDownload,
  StoreSettings,
} from '../types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('bananaos_bananaos-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.accessToken;
    }
  } catch { /* ignore */ }
  return undefined;
}

export const bananaAppService = {
  async getFeatured(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/featured', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getTrending(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/trending', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getRecommended(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/recommended', {
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getEditorsChoice(): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>('/api/store/editors-choice', {
      token: getToken(),
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
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async search(q: string, sort = 'relevance'): Promise<StoreApp[]> {
    const res = await apiRequest<{ success: boolean; data: StoreApp[] }>(
      `/api/store/search?q=${encodeURIComponent(q)}&sort=${sort}`,
      { token: getToken() }
    );
    return res.data ?? [];
  },

  async getAppDetail(bundleId: string): Promise<StoreApp> {
    const res = await apiRequest<{ success: boolean; data: StoreApp }>(
      `/api/store/apps/${bundleId}`,
      { token: getToken() }
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
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/apps/${bundleId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
      token,
    });
  },

  async install(bundleId: string): Promise<{ downloadId: string }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { downloadId: string } }>(
      `/api/store/apps/${bundleId}/install`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async completeInstall(downloadId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/complete`, { method: 'POST', token });
  },

  async uninstall(bundleId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/apps/${bundleId}/uninstall`, { method: 'DELETE', token });
  },

  async update(bundleId: string): Promise<{ downloadId: string }> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { downloadId: string } }>(
      `/api/store/apps/${bundleId}/update`,
      { method: 'POST', token }
    );
    return res.data!;
  },

  async completeUpdate(downloadId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/store/downloads/${downloadId}/complete-update`, { method: 'POST', token });
  },

  async getInstalled(): Promise<InstalledStoreApp[]> {
    const token = getToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: InstalledStoreApp[] }>(
      '/api/store/installed',
      { token }
    );
    return res.data ?? [];
  },

  async getDownloads(): Promise<StoreDownload[]> {
    const token = getToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: StoreDownload[] }>(
      '/api/store/downloads',
      { token }
    );
    return res.data ?? [];
  },

  async getUpdates(): Promise<InstalledStoreApp[]> {
    const token = getToken();
    if (!token) return [];
    const res = await apiRequest<{ success: boolean; data: InstalledStoreApp[] }>(
      '/api/store/updates',
      { token }
    );
    return res.data ?? [];
  },

  async getSettings(): Promise<StoreSettings> {
    const token = getToken();
    if (!token) return { autoUpdate: true, cellularDownloads: false, notifyUpdates: true };
    const res = await apiRequest<{ success: boolean; data: StoreSettings }>(
      '/api/store/settings',
      { token }
    );
    return res.data!;
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: StoreSettings }>(
      '/api/store/settings',
      { method: 'PATCH', body: JSON.stringify(settings), token }
    );
    return res.data!;
  },

  async seedStore(): Promise<void> {
    const token = getToken();
    await apiRequest('/api/store/seed', { method: 'POST', token });
  },
};
