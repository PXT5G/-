'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { useHaptic } from '@/hooks/useSound';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/stores/toastStore';
import { queueIfOffline } from '../hooks/usePhoneOffline';

export function BlockedNumbersScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'blocked'],
    queryFn: () => phoneService.getBlocked(),
  });
  const queryClient = useQueryClient();
  const { tap } = useHaptic();
  const online = useOnlineStatus();

  const handleBlock = async () => {
    if (!phoneNumber.trim()) return;
    tap();
    const payload = { phoneNumber };
    if (queueIfOffline(online, 'blockNumber', payload)) {
      setPhoneNumber('');
      return;
    }
    try {
      await phoneService.blockNumber(payload);
      setPhoneNumber('');
      queryClient.invalidateQueries({ queryKey: ['phone', 'blocked'] });
      toast('Number blocked', 'success');
    } catch {
      toast('Failed to block number', 'error');
    }
  };

  const handleUnblock = async (id: string) => {
    tap();
    if (queueIfOffline(online, 'unblockNumber', { id })) return;
    try {
      await phoneService.unblockNumber(id);
      queryClient.invalidateQueries({ queryKey: ['phone', 'blocked'] });
      toast('Number unblocked', 'success');
    } catch {
      toast('Failed to unblock number', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={2} height="h-14" />;
  if (error) return <EmptyState icon="🚫" title="Unable to Load" description="Failed to load blocked numbers. Pull to refresh or try again." />;

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
            aria-label="Phone number to block"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[44px]"
          />
          <button
            type="button"
            onClick={handleBlock}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-400/30 min-h-[44px]"
          >
            Block
          </button>
        </div>
      </GlassCard>

      {blocked.length === 0 ? (
        <EmptyState icon="🚫" title="No Blocked Numbers" description="Numbers you block will appear here." />
      ) : (
        blocked.map((b) => (
          <GlassCard key={b.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm">{b.phoneNumber}</p>
                {b.label && <p className="text-white/40 text-[10px]">{b.label}</p>}
              </div>
              <button type="button" onClick={() => handleUnblock(b.id)} className="text-banana-gold text-xs min-h-[44px] px-2" aria-label={`Unblock ${b.phoneNumber}`}>
                Unblock
              </button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
