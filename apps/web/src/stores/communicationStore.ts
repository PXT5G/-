import { create } from 'zustand';
import type { ConversationSnapshot, MessageSnapshot, PresenceSnapshot } from '@/types';

interface CommunicationStoreState {
  conversations: ConversationSnapshot[];
  activeConversationId: string | null;
  messages: Record<string, MessageSnapshot[]>;
  presence: Record<string, PresenceSnapshot>;
  typing: Record<string, string[]>;
  unreadTotal: number;
  setConversations: (v: ConversationSnapshot[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: MessageSnapshot) => void;
  setMessages: (conversationId: string, messages: MessageSnapshot[]) => void;
  setPresence: (userId: string, presence: PresenceSnapshot) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  updateConversation: (conversation: ConversationSnapshot) => void;
}

export const useCommunicationStore = create<CommunicationStoreState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  presence: {},
  typing: {},
  unreadTotal: 0,
  setConversations: (conversations) =>
    set({
      conversations,
      unreadTotal: conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), message],
      },
    })),
  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),
  setPresence: (userId, presence) =>
    set((state) => ({ presence: { ...state.presence, [userId]: presence } })),
  setTyping: (conversationId, userIds) =>
    set((state) => ({ typing: { ...state.typing, [conversationId]: userIds } })),
  updateConversation: (conversation) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversation.conversationId ? { ...c, ...conversation } : c
      ),
    })),
}));
