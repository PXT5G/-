import { apiRequest } from '@/utils/api';
import type { ApiResponse } from '@/types';
import type { ConversationSnapshot, MessageSnapshot } from '@/types';

export interface ChatInit {
  profile: Record<string, unknown>;
  permissions: string[];
  integrations: Record<string, boolean>;
  privacy: Record<string, unknown>;
  stickerPacks: { packId: string; name: string; stickerCount: number }[];
  emojiCategories: string[];
}

export const chatService = {
  async initialize(token: string) {
    const res = await apiRequest<ApiResponse<ChatInit>>('/api/chat/initialize', { method: 'POST', token });
    return res.data!;
  },

  async getInbox(token: string, params?: Record<string, string>) {
    const q = params ? `?${new URLSearchParams(params)}` : '';
    const res = await apiRequest<ApiResponse<ConversationSnapshot[]>>(`/api/chat/inbox${q}`, { token });
    return res.data!;
  },

  async getConversation(token: string, conversationId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/conversations/${conversationId}`, { token });
    return res.data!;
  },

  async createPrivate(token: string, userId: string) {
    const res = await apiRequest<ApiResponse<ConversationSnapshot>>('/api/chat/conversations/private', {
      method: 'POST', token, body: JSON.stringify({ userId }),
    });
    return res.data!;
  },

  async createGroup(token: string, body: { title: string; memberIds: string[]; description?: string }) {
    const res = await apiRequest<ApiResponse<ConversationSnapshot>>('/api/chat/conversations/group', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getMessages(token: string, conversationId: string, before?: string) {
    const q = before ? `?before=${encodeURIComponent(before)}` : '';
    const res = await apiRequest<ApiResponse<MessageSnapshot[]>>(`/api/chat/conversations/${conversationId}/messages${q}`, { token });
    return res.data!;
  },

  async sendMessage(token: string, body: {
    conversationId: string;
    body: string;
    contentType?: string;
    replyToMessageId?: string;
    silent?: boolean;
    clientMessageId?: string;
  }) {
    const res = await apiRequest<ApiResponse<MessageSnapshot>>(`/api/chat/conversations/${body.conversationId}/messages`, {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async sendRichMessage(token: string, body: { conversationId: string; richType: string; data: Record<string, unknown> }) {
    const res = await apiRequest<ApiResponse<MessageSnapshot>>(`/api/chat/conversations/${body.conversationId}/messages/rich`, {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async updateMeta(token: string, conversationId: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/conversations/${conversationId}/meta`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async pinConversation(token: string, conversationId: string, pinned: boolean) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/conversations/${conversationId}/pin`, {
      method: 'POST', token, body: JSON.stringify({ pinned }),
    });
    return res.data!;
  },

  async search(token: string, q: string, type?: string) {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/chat/search?${params}`, { token });
    return res.data!;
  },

  async react(token: string, messageId: string, conversationId: string, emoji: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST', token, body: JSON.stringify({ conversationId, emoji }),
    });
    return res.data!;
  },

  async startCall(token: string, body: { conversationId: string; callType: string; recording?: boolean }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/chat/calls', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async endCall(token: string, callId: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/calls/${callId}/end`, {
      method: 'POST', token,
    });
    return res.data!;
  },

  async getCallHistory(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/chat/calls/history', { token });
    return res.data!;
  },

  async getMessageRequests(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>('/api/chat/message-requests', { token });
    return res.data!;
  },

  async respondMessageRequest(token: string, requestId: string, action: 'accept' | 'decline' | 'block') {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>(`/api/chat/message-requests/${requestId}/respond`, {
      method: 'POST', token, body: JSON.stringify({ action }),
    });
    return res.data!;
  },

  async getPrivacy(token: string) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/chat/privacy', { token });
    return res.data!;
  },

  async updatePrivacy(token: string, body: Record<string, unknown>) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/chat/privacy', {
      method: 'PATCH', token, body: JSON.stringify(body),
    });
    return res.data!;
  },

  async getStickers(token: string, packId?: string) {
    const q = packId ? `?packId=${packId}` : '';
    const res = await apiRequest<ApiResponse<Record<string, unknown>[]>>(`/api/chat/stickers${q}`, { token });
    return res.data!;
  },

  async setTyping(token: string, conversationId: string, isTyping: boolean) {
    await apiRequest(`/api/chat/conversations/${conversationId}/typing`, {
      method: 'POST', token, body: JSON.stringify({ isTyping }),
    });
  },

  async createPoll(token: string, body: { conversationId: string; question: string; options: string[] }) {
    const res = await apiRequest<ApiResponse<Record<string, unknown>>>('/api/chat/polls', {
      method: 'POST', token, body: JSON.stringify(body),
    });
    return res.data!;
  },
};
