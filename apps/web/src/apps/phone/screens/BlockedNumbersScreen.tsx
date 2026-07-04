'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { GlassCard } from '../components/GlassCard';
import { useHaptic } from '@/hooks/useSound';

export function BlockedNumbersScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'blocked'],
    queryFn: () => phoneService.getBlocked(),
  });
  const queryClient = useQueryClient();
  const { tap } = useHaptic();

  const handleBlock = async () => {
    if (!phoneNumber.trim()) return;
    tap();
    await phoneService.blockNumber({ phoneNumber });
    setPhoneNumber('');
    queryClient.invalidateQueries({ queryKey: ['phone', 'blocked'] });
  };

  const handleUnblock = async (id: string) => {
    tap();
    await phoneService.unblockNumber(id);
    queryClient.invalidateQueries({ queryKey: ['phone', 'blocked'] });
  };

  if (isLoading) return <div className="p-4 space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}</div>;
  if (error) return <div className="p-6 text-center text-white/50 text-sm">Failed to load blocked numbers</div>;

  const blocked = data ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      <GlassCard>
        <p className="text-white/60 text-xs mb-2">Block a number</p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1..."
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button type="button" onClick={handleBlock} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-400/30">
            Block
          </button>
        </div>
      </GlassCard>

      {blocked.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">No blocked numbers</div>
      ) : (
        blocked.map((b) => (
          <GlassCard key={b.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">{b.phoneNumber}</p>
                {b.label && <p className="text-white/40 text-[10px]">{b.label}</p>}
              </div>
              <button type="button" onClick={() => handleUnblock(b.id)} className="text-green-400 text-xs">Unblock</button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
