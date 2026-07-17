import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';
import type { ApiResponse, ConversationSnapshot, MessageSnapshot } from '@/types';

export const messagesAppService = {
  async initialize() {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/messages/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getConversations() {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<ConversationSnapshot[]>>('/api/messages/conversations', { token });
    return res.data!;
  },

  async getMessages(conversationId: string) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<MessageSnapshot[]>>(`/api/messages/conversations/${conversationId}/messages`, { token });
    return res.data!;
  },

  async send(body: { toUserId?: string; phoneNumber?: string; body: string }) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<MessageSnapshot>>('/api/messages/send', { method: 'POST', token, body: JSON.stringify(body) });
    return res.data!;
  },

  async search(q: string) {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/messages/search?q=${encodeURIComponent(q)}`, { token });
    return res.data!;
  },
};
