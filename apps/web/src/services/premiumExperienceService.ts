import { apiRequest } from '@/utils/api';
import type {
  PremiumExperienceSnapshot,
  WidgetRegistrySnapshot,
  NotificationHistorySnapshot,
} from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.tokens?.accessToken;
    }
  } catch { /* ignore */ }
  return undefined;
}

export const premiumExperienceService = {
  async getProfile(): Promise<PremiumExperienceSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PremiumExperienceSnapshot }>(
      '/api/device/premium/profile',
      { token }
    );
    return res.data!;
  },

  async updateProfile(updates: Partial<PremiumExperienceSnapshot>): Promise<PremiumExperienceSnapshot> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: PremiumExperienceSnapshot }>(
      '/api/device/premium/profile',
      { method: 'PATCH', body: JSON.stringify(updates), token }
    );
    return res.data!;
  },

  async getAppLibrary(): Promise<Record<string, unknown>> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Record<string, unknown> }>(
      '/api/device/premium/app-library',
      { token }
    );
    return res.data!;
  },

  async getWidgetRegistry(): Promise<WidgetRegistrySnapshot[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: WidgetRegistrySnapshot[] }>(
      '/api/device/premium/widgets/registry',
      { token }
    );
    return res.data!;
  },

  async getWidgetData(type: string): Promise<Record<string, unknown>> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: Record<string, unknown> }>(
      `/api/device/premium/widgets/${type}/data`,
      { token }
    );
    return res.data!;
  },

  async getNotificationHistory(): Promise<NotificationHistorySnapshot[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: NotificationHistorySnapshot[] }>(
      '/api/device/premium/notifications/history',
      { token }
    );
    return res.data!;
  },

  async trackAppUsage(bundleId: string): Promise<void> {
    const token = getToken();
    if (!token) return;
    await apiRequest('/api/device/premium/track-app', {
      method: 'POST',
      body: JSON.stringify({ bundleId }),
      token,
    });
  },

  async addQuickNote(note: string): Promise<string[]> {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: string[] }>(
      '/api/device/premium/quick-notes',
      { method: 'POST', body: JSON.stringify({ note }), token }
    );
    return res.data!;
  },
};
