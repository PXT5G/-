import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';
import type { ApiResponse } from '@/types';

export const mailAppService = {
  async initialize(email?: string) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/mail/initialize', {
      method: 'POST', token, body: JSON.stringify({ email }),
    });
    return res.data!;
  },

  async getMessages(folder = 'inbox', search?: string) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const params = new URLSearchParams({ folder });
    if (search) params.set('search', search);
    const res = await apiRequest<ApiResponse<{ messages: Record<string, unknown>[]; total: number }>>(`/api/mail/messages?${params}`, { token });
    return res.data!;
  },

  async send(body: { accountId: string; to: string[]; subject: string; bodyText: string; bodyHtml?: string }) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/mail/send', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async updateMessage(messageId: string, body: { isRead?: boolean; isStarred?: boolean; folder?: string }) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/mail/messages/${messageId}`, { method: 'PATCH', token, body: JSON.stringify(body) });
    return res.data!;
  },
};
