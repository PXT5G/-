import { apiRequest } from '@/utils/api';
import type { ApiResponse, ConversationSnapshot, MessageSnapshot } from '@/types';

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('gulfos_gulfos-auth');
    if (raw) return JSON.parse(raw)?.state?.tokens?.accessToken;
  } catch { /* ignore */ }
  return undefined;
}

export const messagesAppService = {
  async initialize() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/messages/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getConversations() {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<ConversationSnapshot[]>>('/api/messages/conversations', { token });
    return res.data!;
  },

  async getMessages(conversationId: string) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<MessageSnapshot[]>>(`/api/messages/conversations/${conversationId}/messages`, { token });
    return res.data!;
  },

  async send(body: { toUserId?: string; phoneNumber?: string; body: string }) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<MessageSnapshot>>('/api/messages/send', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async search(q: string) {
    const token = getToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/messages/search?q=${encodeURIComponent(q)}`, { token });
    return res.data!;
  },
};
