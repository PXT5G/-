'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { policeService } from '../services/policeService';
import { GlassCard } from '../components/GlassCard';
import { Button } from '@/components/shared/Button';

const CHANNELS = [
  { id: 'general', label: 'General', minRank: 'officer' },
  { id: 'patrol', label: 'Patrol', minRank: 'officer' },
  { id: 'investigations', label: 'Investigations', minRank: 'sergeant' },
  { id: 'command', label: 'Command', minRank: 'lieutenant' },
];

export function ChatScreen() {
  const [channel, setChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['police', 'chat', channel],
    queryFn: () => policeService.getChat(channel),
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await policeService.sendChat(channel, message.trim());
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['police', 'chat', channel] });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-2">Secure Internal Chat</p>
        <div className="flex gap-1 overflow-x-auto">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannel(ch.id)}
              className={`px-3 py-1 rounded-full text-[10px] whitespace-nowrap ${channel === ch.id ? 'bg-banana-gold/20 text-banana-gold border border-banana-gold/30' : 'bg-white/5 text-white/50'}`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>}
        {messages?.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <GlassCard className="py-2 px-3">
              <div className="flex items-baseline gap-2">
                <span className="text-banana-gold text-[10px] font-medium">{m.senderName}</span>
                <span className="text-white/30 text-[9px]">{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-white/80 text-sm mt-0.5">{m.message}</p>
            </GlassCard>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Encrypted message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30"
        />
        <Button label="Send" onClick={handleSend} loading={sending} size="sm" />
      </div>
    </div>
  );
}
