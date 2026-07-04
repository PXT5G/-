import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import type { Contact, ContactGroup, ContactsDashboard, ContactAuditEntry } from '../types';

function getToken(): string | undefined {
  return useAuthStore.getState().getAccessToken() ?? undefined;
}

export const contactsService = {
  async initPermissions(): Promise<string[]> {
    const res = await apiRequest<{ success: boolean; data: string[] }>('/api/contacts/permissions/init', {
      method: 'POST',
      token: getToken(),
    });
    return res.data ?? [];
  },

  async getDashboard(): Promise<ContactsDashboard> {
    const res = await apiRequest<{ success: boolean; data: ContactsDashboard }>('/api/contacts/dashboard', {
      token: getToken(),
    });
    return res.data!;
  },

  async list(params?: { favorite?: boolean; blocked?: boolean; emergency?: boolean; type?: string }): Promise<Contact[]> {
    const qs = new URLSearchParams();
    if (params?.favorite) qs.set('favorite', 'true');
    if (params?.blocked) qs.set('blocked', 'true');
    if (params?.emergency) qs.set('emergency', 'true');
    if (params?.type) qs.set('type', params.type);
    const res = await apiRequest<{ success: boolean; data: Contact[] }>(`/api/contacts?${qs}`, { token: getToken() });
    return res.data ?? [];
  },

  async search(q: string, filters?: { type?: string; tag?: string; favorite?: boolean }): Promise<Contact[]> {
    const qs = new URLSearchParams({ q });
    if (filters?.type) qs.set('type', filters.type);
    if (filters?.tag) qs.set('tag', filters.tag);
    if (filters?.favorite) qs.set('favorite', 'true');
    const res = await apiRequest<{ success: boolean; data: Contact[] }>(`/api/contacts/search?${qs}`, { token: getToken() });
    return res.data ?? [];
  },

  async getById(id: string): Promise<Contact> {
    const res = await apiRequest<{ success: boolean; data: Contact }>(`/api/contacts/${id}`, { token: getToken() });
    return res.data!;
  },

  async create(data: Partial<Contact> & { firstName: string; phoneNumbers: Contact['phoneNumbers'] }): Promise<Contact> {
    const res = await apiRequest<{ success: boolean; data: Contact }>('/api/contacts', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const res = await apiRequest<{ success: boolean; data: Contact }>(`/api/contacts/${id}`, {
      method: 'PUT',
      token: getToken(),
      body: JSON.stringify(data),
    });
    return res.data!;
  },

  async remove(id: string): Promise<void> {
    await apiRequest(`/api/contacts/${id}`, { method: 'DELETE', token: getToken() });
  },

  async toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    const res = await apiRequest<{ success: boolean; data: { isFavorite: boolean } }>(`/api/contacts/${id}/favorite`, {
      method: 'POST',
      token: getToken(),
    });
    return res.data!;
  },

  async block(id: string, reason?: string): Promise<void> {
    await apiRequest(`/api/contacts/${id}/block`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ reason }),
    });
  },

  async unblock(id: string): Promise<void> {
    await apiRequest(`/api/contacts/${id}/unblock`, { method: 'POST', token: getToken() });
  },

  async getFavorites(): Promise<Contact[]> {
    const res = await apiRequest<{ success: boolean; data: Contact[] }>('/api/contacts/favorites', { token: getToken() });
    return res.data ?? [];
  },

  async getRecent(): Promise<Contact[]> {
    const res = await apiRequest<{ success: boolean; data: Contact[] }>('/api/contacts/recent', { token: getToken() });
    return res.data ?? [];
  },

  async getEmergency(): Promise<Contact[]> {
    const res = await apiRequest<{ success: boolean; data: Contact[] }>('/api/contacts/emergency', { token: getToken() });
    return res.data ?? [];
  },

  async importContacts(contacts: Array<{ firstName: string; lastName?: string; phoneNumbers: Contact['phoneNumbers']; email?: string }>): Promise<{ imported: number; failed: number }> {
    const res = await apiRequest<{ success: boolean; data: { imported: number; failed: number } }>('/api/contacts/import', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ contacts }),
    });
    return res.data!;
  },

  async exportContacts(): Promise<Contact[]> {
    const res = await apiRequest<{ success: boolean; data: Contact[] }>('/api/contacts/export/all', { token: getToken() });
    return res.data ?? [];
  },

  async syncIdentity(): Promise<Contact> {
    const res = await apiRequest<{ success: boolean; data: Contact }>('/api/contacts/sync/identity', {
      method: 'POST',
      token: getToken(),
    });
    return res.data!;
  },

  async getGroups(): Promise<ContactGroup[]> {
    const res = await apiRequest<{ success: boolean; data: ContactGroup[] }>('/api/contacts/groups/list', { token: getToken() });
    return res.data ?? [];
  },

  async createGroup(name: string, color?: string, icon?: string): Promise<ContactGroup> {
    const res = await apiRequest<{ success: boolean; data: ContactGroup }>('/api/contacts/groups', {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ name, color, icon }),
    });
    return res.data!;
  },

  async deleteGroup(id: string): Promise<void> {
    await apiRequest(`/api/contacts/groups/${id}`, { method: 'DELETE', token: getToken() });
  },

  async addToGroup(groupId: string, contactId: string): Promise<void> {
    await apiRequest(`/api/contacts/groups/${groupId}/add`, {
      method: 'POST',
      token: getToken(),
      body: JSON.stringify({ contactId }),
    });
  },

  async getAuditLogs(): Promise<ContactAuditEntry[]> {
    const res = await apiRequest<{ success: boolean; data: ContactAuditEntry[] }>('/api/contacts/audit/logs', { token: getToken() });
    return res.data ?? [];
  },

  async getAdminStats(): Promise<Record<string, number>> {
    const res = await apiRequest<{ success: boolean; data: Record<string, number> }>('/api/contacts/admin/stats', { token: getToken() });
    return res.data ?? {};
  },

  async getAdminAudit(): Promise<ContactAuditEntry[]> {
    const res = await apiRequest<{ success: boolean; data: ContactAuditEntry[] }>('/api/contacts/admin/audit', { token: getToken() });
    return res.data ?? [];
  },
};
