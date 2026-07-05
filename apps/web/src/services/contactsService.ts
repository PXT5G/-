import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) return JSON.parse(raw)?.state?.tokens?.accessToken;
  } catch { /* ignore */ }
  return undefined;
}

export interface ContactSnapshot {
  contactId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  category: string;
  phones: { label: string; number: string; primary?: boolean }[];
  emails: { label: string; email: string }[];
  favorite: boolean;
  emergency: boolean;
  company?: string;
}

export const contactsService = {
  async initialize() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/contacts/initialize', { method: 'POST', token });
    return res.data!;
  },

  async list(params?: { category?: string; favorite?: boolean; search?: string }) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const q = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))}` : '';
    const res = await apiRequest<ApiResponse<{ contacts: ContactSnapshot[]; total: number }>>(`/api/contacts${q}`, { token });
    return res.data!;
  },

  async create(body: Partial<ContactSnapshot>) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<ContactSnapshot>>('/api/contacts', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async update(contactId: string, body: Partial<ContactSnapshot>) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<ContactSnapshot>>(`/api/contacts/${contactId}`, { method: 'PATCH', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async remove(contactId: string) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<{ deleted: boolean }>>(`/api/contacts/${contactId}`, { method: 'DELETE', token });
    return res.data!;
  },
};
