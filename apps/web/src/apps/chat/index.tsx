'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useChatInit, useChatInbox, useChatMessages, useChatConversation,
  useChatSearch, useChatMessageRequests, useChatCallHistory,
  useSendMessage, useUpdateChatMeta, useStartCall, useRespondMessageRequest,
} from '@/hooks/useChat';
import { chatService } from '@/services/chatService';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';
import type { ConversationSnapshot, MessageSnapshot } from '@/types';

type Tab = 'chats' | 'calls' | 'search' | 'settings';
type InboxFilter = 'all' | 'unread' | 'favorites' | 'archived';

function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div
      className="rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

function MessageBubble({ msg, isOwn }: { msg: MessageSnapshot & Record<string, unknown>; isOwn: boolean }) {
  const time = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const reactions = (msg.reactions as { emoji: string; count: number }[] | undefined) ?? [];
  const replyTo = msg.replyToMessageId as string | undefined;
  const editedAt = msg.editedAt as string | undefined;
  const deliveryState = msg.deliveryState as string | undefined;

  return (
    <div className={cn('flex mb-2', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
        isOwn ? 'bg-red-600/90 text-white rounded-br-md' : 'bg-white/10 text-white rounded-bl-md'
      )}>
        {replyTo && (
          <p className="text-[10px] opacity-60 border-l-2 border-gulf-gold pl-2 mb-1">Reply</p>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        {msg.contentType !== 'text' && (
          <p className="text-[10px] opacity-50 mt-1 capitalize">{msg.contentType?.replace('_', ' ')}</p>
        )}
        <div className="flex items-center justify-end gap-1 mt-1">
          {editedAt && <span className="text-[9px] opacity-40">edited</span>}
          <span className="text-[9px] opacity-40">{time}</span>
          {isOwn && (
            <span className="text-[9px] opacity-60">
              {deliveryState === 'read' ? '✓✓' : deliveryState === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
        {reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {reactions.map((r, i) => (
              <span key={i} className="text-xs bg-white/10 rounded-full px-1.5">{r.emoji}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationRow({
  conv, active, onClick,
}: { conv: ConversationSnapshot & Record<string, unknown>; active: boolean; onClick: () => void }) {
  const title = String(conv.title ?? 'Chat');
  const preview = String(conv.lastMessagePreview ?? '');
  const unread = Number(conv.unreadCount ?? 0);
  const pinned = Boolean(conv.pinned);
  const favorite = Boolean(conv.favorite);
  const priority = Boolean(conv.priority);

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Glass className={cn('p-3 mb-2 transition-colors', active ? 'bg-white/10 border-red-500/30' : 'hover:bg-white/8')}>
        <div className="flex items-center gap-3">
          <Avatar name={title} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {pinned && <span className="text-[10px]">📌</span>}
              {favorite && <span className="text-[10px]">⭐</span>}
              {priority && <span className="text-[10px] text-gulf-gold">🔔</span>}
              <p className="text-white font-medium text-sm truncate">{title}</p>
            </div>
            <p className="text-white/40 text-xs truncate mt-0.5">{preview || 'No messages yet'}</p>
          </div>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </Glass>
    </button>
  );
}

function ChatThread({
  conversationId,
  onBack,
}: { conversationId: string; onBack: () => void }) {
  const { data: conv } = useChatConversation(conversationId);
  const { data: messages, refetch } = useChatMessages(conversationId);
  const sendMessage = useSendMessage();
  const startCall = useStartCall();
  const updateMeta = useUpdateChatMeta();
  const { tap } = useHaptic();
  const userId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.getAccessToken());
  const [text, setText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [activeCall, setActiveCall] = useState<Record<string, unknown> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = String((conv as Record<string, unknown>)?.title ?? 'Chat');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    tap();
    const body = text.trim();
    setText('');
    await sendMessage.mutateAsync({
      conversationId,
      body,
      clientMessageId: `client-${Date.now()}`,
    });
    if (token) chatService.setTyping(token, conversationId, false);
    refetch();
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!token) return;
    chatService.setTyping(token, conversationId, true);
    clearTimeout(typingTimer.current ?? undefined);
    typingTimer.current = setTimeout(() => {
      chatService.setTyping(token, conversationId, false);
    }, 2000);
  };

  const handleCall = async (callType: string) => {
    tap();
    const call = await startCall.mutateAsync({ conversationId, callType });
    setActiveCall(call);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!token) return;
    tap();
    await chatService.react(token, messageId, conversationId, emoji);
    refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-black/80">
        <button type="button" onClick={onBack} className="text-white/60 text-lg">←</button>
        <Avatar name={title} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{title}</p>
          <p className="text-white/40 text-[10px]">End-to-end encrypted</p>
        </div>
        <button type="button" onClick={() => handleCall('voice')} className="text-white/60 p-2">📞</button>
        <button type="button" onClick={() => handleCall('video')} className="text-white/60 p-2">📹</button>
        <button type="button" onClick={() => setShowActions(!showActions)} className="text-white/60 p-2">⋮</button>
      </div>

      {activeCall && (
        <Glass className="mx-3 mt-2 p-3 flex items-center justify-between">
          <span className="text-white text-sm">
            {String(activeCall.callType)} call — {String(activeCall.status)}
          </span>
          <button
            type="button"
            onClick={async () => {
              if (token && activeCall.callId) {
                await chatService.endCall(token, String(activeCall.callId));
                setActiveCall(null);
              }
            }}
            className="text-red-400 text-xs font-medium"
          >
            End
          </button>
        </Glass>
      )}

      <AnimatePresence>
        {showActions && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="flex gap-2 px-3 py-2 overflow-x-auto">
              {[
                { label: 'Pin', action: () => updateMeta.mutate({ conversationId, favorite: true }) },
                { label: 'Archive', action: () => updateMeta.mutate({ conversationId, archived: true }) },
                { label: 'Mute', icon: '🔇' },
                { label: 'Location', icon: '📍', action: () => sendMessage.mutate({
                  conversationId, body: 'Shared location', contentType: 'location',
                }) },
              ].map((a) => (
                <button key={a.label} type="button" onClick={() => { tap(); a.action?.(); }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-white/70 text-xs whitespace-nowrap">
                  {a.icon ?? ''} {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {(messages ?? []).map((msg) => (
          <div key={msg.messageId} className="group relative">
            <MessageBubble msg={msg as MessageSnapshot & Record<string, unknown>} isOwn={msg.senderId === userId} />
            <div className="opacity-0 group-hover:opacity-100 absolute right-2 top-0 flex gap-1 transition-opacity">
              {['👍', '❤️', '😂'].map((e) => (
                <button key={e} type="button" onClick={() => handleReact(msg.messageId, e)}
                  className="text-xs bg-black/60 rounded-full w-6 h-6">{e}</button>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-2 px-3 py-2 border-t border-white/10 bg-black/80 safe-area-bottom">
        <button type="button" onClick={() => setShowActions(!showActions)} className="text-white/40 text-xl pb-2">+</button>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
        />
        <button type="submit" disabled={!text.trim()} className="text-red-400 font-semibold text-sm pb-2 disabled:opacity-30">
          Send
        </button>
      </form>
    </div>
  );
}

function InboxScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState<InboxFilter>('all');
  const filterParams: Record<string, string> = {};
  if (filter === 'unread') filterParams.unreadOnly = 'true';
  if (filter === 'favorites') filterParams.favorites = 'true';
  if (filter === 'archived') filterParams.archived = 'true';

  const { data: inbox, isLoading } = useChatInbox(filterParams);
  const { data: requests } = useChatMessageRequests();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {(['all', 'unread', 'favorites', 'archived'] as InboxFilter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={cn('px-3 py-1 rounded-full text-xs capitalize whitespace-nowrap',
              filter === f ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50')}>
            {f}
          </button>
        ))}
      </div>

      {(requests ?? []).length > 0 && (
        <Glass className="p-3 mb-3 border-yellow-500/30">
          <p className="text-yellow-400 text-xs font-medium">{requests!.length} message request(s)</p>
        </Glass>
      )}

      {(inbox ?? []).length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start a new chat from Search</p>
        </div>
      ) : (
        inbox!.map((conv) => (
          <ConversationRow
            key={conv.conversationId}
            conv={conv as ConversationSnapshot & Record<string, unknown>}
            active={false}
            onClick={() => onSelect(conv.conversationId)}
          />
        ))
      )}
    </div>
  );
}

function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data: results } = useChatSearch(query);

  return (
    <div className="p-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search messages, chats, users..."
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500/50 mb-4"
      />
      {(results ?? []).map((r, i) => (
        <Glass key={i} className="p-3 mb-2">
          <p className="text-white text-sm">{String(r.title ?? r.body ?? r.type)}</p>
          <p className="text-white/40 text-xs mt-1">{String(r.type ?? 'result')}</p>
        </Glass>
      ))}
      {query.length > 1 && (results ?? []).length === 0 && (
        <p className="text-white/40 text-center py-8 text-sm">No results</p>
      )}
    </div>
  );
}

function CallsScreen() {
  const { data: calls } = useChatCallHistory();

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Recent Calls</p>
      {(calls ?? []).map((c) => (
        <Glass key={String(c.callId)} className="p-3 flex items-center justify-between">
          <div>
            <p className="text-white text-sm capitalize">{String(c.callType)} call</p>
            <p className="text-white/40 text-xs">{String(c.status)} · {Number(c.durationSeconds)}s</p>
          </div>
          <span className="text-lg">{c.callType === 'video' ? '📹' : '📞'}</span>
        </Glass>
      ))}
      {(calls ?? []).length === 0 && (
        <p className="text-white/40 text-center py-16 text-sm">No call history</p>
      )}
    </div>
  );
}

function MessageRequestsScreen() {
  const { data: requests } = useChatMessageRequests();
  const respond = useRespondMessageRequest();
  const { tap } = useHaptic();

  return (
    <div className="p-4 space-y-2">
      {(requests ?? []).map((r) => (
        <Glass key={String(r.requestId)} className="p-4">
          <p className="text-white font-medium text-sm">{String(r.fromName)}</p>
          <p className="text-white/60 text-sm mt-2">{String(r.message)}</p>
          <div className="flex gap-2 mt-3">
            {(['accept', 'decline', 'block'] as const).map((action) => (
              <button key={action} type="button"
                onClick={() => { tap(); respond.mutate({ requestId: String(r.requestId), action }); }}
                className={cn('flex-1 py-2 rounded-xl text-xs font-medium capitalize',
                  action === 'accept' ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70')}>
                {action}
              </button>
            ))}
          </div>
        </Glass>
      ))}
    </div>
  );
}

function SettingsScreen() {
  const { data: init } = useChatInit();
  const integrations = init?.integrations ?? {};

  return (
    <div className="p-4 space-y-4">
      <Glass className="p-4">
        <p className="text-gulf-gold text-xs uppercase tracking-wider mb-2">Profile</p>
        <p className="text-white font-medium">{String(init?.profile?.displayName ?? 'User')}</p>
        <p className="text-white/40 text-xs mt-1">{String(init?.profile?.about ?? '')}</p>
        {Boolean(init?.profile?.biometricLock) && (
          <p className="text-green-400 text-xs mt-2">🔒 Biometric lock enabled</p>
        )}
      </Glass>

      <Glass className="p-4">
        <p className="text-gulf-gold text-xs uppercase tracking-wider mb-3">Integrations</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(integrations).map(([key, active]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className={active ? 'text-green-400' : 'text-white/30'}>{active ? '●' : '○'}</span>
              <span className="text-white/70 capitalize">{key}</span>
            </div>
          ))}
        </div>
      </Glass>

      <Glass className="p-4">
        <p className="text-gulf-gold text-xs uppercase tracking-wider mb-2">Privacy</p>
        <p className="text-white/60 text-xs">Last seen: {String(init?.privacy?.lastSeen ?? 'contacts')}</p>
        <p className="text-white/60 text-xs mt-1">Read receipts: {init?.privacy?.readReceipts ? 'On' : 'Off'}</p>
      </Glass>

      <Glass className="p-4">
        <p className="text-gulf-gold text-xs uppercase tracking-wider mb-2">Security</p>
        <p className="text-white/60 text-xs">AES-256-GCM end-to-end encryption</p>
        <p className="text-white/60 text-xs mt-1">Trusted device verification</p>
      </Glass>
    </div>
  );
}

export function ChatApp() {
  const { isLoading } = useChatInit();
  const [tab, setTab] = useState<Tab>('chats');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(false);
  const { tap } = useHaptic();

  const handleSelectConversation = useCallback((id: string) => {
    tap();
    setActiveConversation(id);
  }, [tap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeConversation) {
    return (
      <div className="h-full bg-black">
        <ChatThread conversationId={activeConversation} onBack={() => setActiveConversation(null)} />
      </div>
    );
  }

  if (showRequests) {
    return (
      <div className="h-full bg-black flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button type="button" onClick={() => setShowRequests(false)} className="text-white/60">←</button>
          <p className="text-white font-semibold">Message Requests</p>
        </div>
        <MessageRequestsScreen />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'chats', label: 'Chats', icon: '💬' },
    { id: 'calls', label: 'Calls', icon: '📞' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/90">
        <div>
          <h1 className="text-white font-bold text-lg">GULF Chat</h1>
          <p className="text-white/40 text-[10px]">End-to-end encrypted</p>
        </div>
        <button type="button" onClick={() => setShowRequests(true)} className="text-white/50 text-sm">
          Requests
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {tab === 'chats' && <InboxScreen onSelect={handleSelectConversation} />}
            {tab === 'calls' && <CallsScreen />}
            {tab === 'search' && <SearchScreen />}
            {tab === 'settings' && <SettingsScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="border-t border-white/10 bg-black/80 backdrop-blur-lg px-2 py-2 safe-area-bottom">
        <div className="flex">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { tap(); setTab(t.id); }}
              className={cn('flex-1 flex flex-col items-center py-1.5 rounded-xl transition-colors',
                tab === t.id ? 'text-red-400' : 'text-white/40')}>
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
