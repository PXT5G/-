import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';

export const assistantService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<unknown>>('/api/assistant/initialize', { method: 'POST', token });
    return res.data!;
  },
  async getConversations(token: string) {
    const res = await apiRequest<ApiResponse<unknown[]>>('/api/assistant/conversations', { token });
    return res.data!;
  },
  async createConversation(token: string, title?: string) {
    const res = await apiRequest<ApiResponse<{ conversationId: string; sessionId: string }>>('/api/assistant/conversations', {
      method: 'POST', token, body: JSON.stringify({ title }),
    });
    return res.data!;
  },
  async sendMessage(token: string, conversationId: string, content: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/assistant/conversations/${conversationId}/messages`, {
      method: 'POST', token, body: JSON.stringify({ content }),
    });
    return res.data!;
  },
  async getMessages(token: string, conversationId: string) {
    const res = await apiRequest<ApiResponse<{ messageId: string; role: string; content: string; createdAt: string }[]>>(
      `/api/assistant/conversations/${conversationId}/messages`, { token }
    );
    return res.data!;
  },
  async confirmAction(token: string, actionId: string) {
    const res = await apiRequest<ApiResponse<unknown>>(`/api/assistant/actions/${actionId}/confirm`, { method: 'POST', token });
    return res.data!;
  },
};
