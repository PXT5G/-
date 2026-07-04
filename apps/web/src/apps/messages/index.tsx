'use client';

import { useState } from 'react';
import { useMessagesInit, useMessagesConversations, useSmsMessages, useSendSms } from '@/hooks/useMessages';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

export function MessagesApp() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { tap } = useHaptic();
  useMessagesInit();
  const { data: conversations } = useMessagesConversations();
  const { data: messages } = useSmsMessages(activeId);
  const sendSms = useSendSms();

  const active = conversations?.find((c) => c.conversationId === activeId);

  const handleSend = () => {
    if (!draft.trim() || !activeId) return;
    tap();
    void sendSms.mutateAsync({ body: draft });
    setDraft('');
  };

  if (activeId && active) {
    return (
      <div className="h-full flex flex-col bg-black text-white">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <button onClick={() => setActiveId(null)} className="text-gulf-gold">‹</button>
          <p className="font-medium">{active.title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(messages ?? []).map((m) => (
            <div key={m.messageId} className={cn('mb-2 max-w-[80%] p-3 rounded-2xl text-sm',
              m.senderId ? 'ml-auto bg-blue-600' : 'bg-white/10')}>
              {m.body}
            </div>
          ))}
        </div>
        <div className="p-4 flex gap-2 border-t border-white/10">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-sm" placeholder="Message" />
          <button onClick={handleSend} className="px-4 py-2 bg-gulf-gold text-black rounded-xl text-sm">Send</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="p-4 border-b border-white/10"><h1 className="text-xl font-bold">Messages</h1></div>
      <div className="flex-1 overflow-y-auto">
        {(conversations ?? []).map((c) => (
          <button key={c.conversationId} onClick={() => { tap(); setActiveId(c.conversationId); }} className="w-full flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5">
            <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center">💬</div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium truncate">{c.title}</p>
              <p className="text-xs text-white/50 truncate">{c.lastMessagePreview}</p>
            </div>
            {Number(c.unreadCount) > 0 && (
              <span className="bg-gulf-gold text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unreadCount}</span>
            )}
          </button>
        ))}
        {(conversations ?? []).length === 0 && <p className="text-center text-white/40 py-12">No conversations</p>}
      </div>
    </div>
  );
}

export default MessagesApp;
