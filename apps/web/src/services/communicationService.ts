import { apiRequest } from '@/utils/api';
import { getAccessToken } from '@/utils/authToken';
import type {
  ConversationSnapshot,
  MessageSnapshot,
  PresenceSnapshot,
} from '@/types';


export const communicationService = {
  async initialize(): Promise<{ ready: boolean; userId: string }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { ready: boolean; userId: string } }>(
      '/api/communication/initialize',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getConversations(): Promise<ConversationSnapshot[]> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: ConversationSnapshot[] }>(
      '/api/communication/conversations',
      { token }
    );
    return res.data ?? [];
  },

  async getMessages(conversationId: string, before?: string): Promise<MessageSnapshot[]> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const qs = before ? `?before=${encodeURIComponent(before)}` : '';
    const res = await apiRequest<{ success: boolean; data: MessageSnapshot[] }>(
      `/api/communication/conversations/${conversationId}/messages${qs}`,
      { token }
    );
    return res.data ?? [];
  },

  async sendMessage(params: {
    conversationId: string;
    body: string;
    messageType?: string;
    contentType?: string;
    replyToMessageId?: string;
    silent?: boolean;
    clientMessageId?: string;
    appId?: string;
  }): Promise<MessageSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: MessageSnapshot }>(
      '/api/communication/messages',
      { method: 'POST', body: JSON.stringify({ appId: 'com.gulfos.communication', ...params }), token }
    );
    return res.data!;
  },

  async markConversationRead(conversationId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/communication/conversations/${conversationId}/read`, { method: 'POST', token });
  },

  async getPresence(userId?: string): Promise<PresenceSnapshot> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await apiRequest<{ success: boolean; data: PresenceSnapshot }>(
      `/api/communication/presence${qs}`,
      { token }
    );
    return res.data!;
  },

  async search(q: string, type?: string): Promise<Array<Record<string, unknown>>> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const qs = new URLSearchParams({ q });
    if (type) qs.set('type', type);
    const res = await apiRequest<{ success: boolean; data: Array<Record<string, unknown>> }>(
      `/api/communication/search?${qs}`,
      { token }
    );
    return res.data ?? [];
  },

  async syncOffline(): Promise<{ synced: number }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { synced: number } }>(
      '/api/communication/sync',
      { method: 'POST', token }
    );
    return res.data!;
  },

  async getSyncStatus(): Promise<{ pending: number; failed: number; synced: number }> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    const res = await apiRequest<{ success: boolean; data: { pending: number; failed: number; synced: number } }>(
      '/api/communication/sync/status',
      { token }
    );
    return res.data!;
  },

  async startTyping(conversationId: string, recording = false): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/communication/conversations/${conversationId}/typing/start`, {
      method: 'POST',
      body: JSON.stringify({ recording }),
      token,
    });
  },

  async stopTyping(conversationId: string): Promise<void> {
    const token = getAccessToken();
    if (!token) throw new Error('Authentication required');
    await apiRequest(`/api/communication/conversations/${conversationId}/typing/stop`, { method: 'POST', token });
  },
};
