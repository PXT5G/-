'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  useAssistantInit, useAssistantSocketSync, useAssistantMessages,
  useSendAssistantMessage, useCreateConversation,
} from '@/hooks/useAssistant';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

interface Message { messageId: string; role: string; content: string; createdAt: string }

export function AssistantApp() {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { tap } = useHaptic();
  useAssistantInit();
  useAssistantSocketSync();
  const { conversationId, mutate: createConv, isPending: creating } = useCreateConversation();
  const { data: messages, isLoading } = useAssistantMessages(conversationId);
  const sendMessage = useSendAssistantMessage(conversationId);

  useEffect(() => {
    if (!conversationId && !creating) createConv();
  }, [conversationId, creating, createConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    tap();
    setThinking(true);
    sendMessage.mutate(input.trim(), {
      onSettled: () => { setThinking(false); setInput(''); },
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2 border-b border-white/10">
        <h1 className="text-xl font-bold text-gulf-gold">GULF Assistant</h1>
        <p className="text-xs text-white/40">Ask anything about your device</p>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-gulf-gold border-t-transparent rounded-full" />
          </div>
        )}
        {(messages as Message[] ?? []).map((m) => (
          <div key={m.messageId} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 text-sm',
              m.role === 'user' ? 'bg-gulf-gold/20 text-white' : 'bg-white/5 border border-white/10 text-white/90')}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-sm text-white/60">Thinking...</motion.span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>
      <footer className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask GULF Assistant..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30"
          />
          <button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}
            className="px-4 py-3 rounded-xl bg-gulf-gold text-black font-semibold text-sm disabled:opacity-50">
            Send
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Search contacts', 'Bank balance', 'Weather', 'Open calendar'].map((s) => (
            <button key={s} onClick={() => setInput(s)}
              className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50 hover:text-white/80">
              {s}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
