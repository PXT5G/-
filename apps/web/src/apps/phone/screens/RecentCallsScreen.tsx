'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';
import { toast } from '@/stores/toastStore';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'incoming', label: 'Incoming' },
  { id: 'outgoing', label: 'Outgoing' },
  { id: 'missed', label: 'Missed' },
] as const;

export function RecentCallsScreen() {
  const [filter, setFilter] = useState<string>('all');
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const { tap } = useHaptic();

  const params = filter === 'missed'
    ? { status: 'missed' }
    : filter === 'all'
      ? {}
      : { direction: filter };

  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'history', filter],
    queryFn: () => phoneService.getHistory(params),
  });

  const items = data?.items ?? [];

  const statusLabel = (status: string, direction: string) => {
    if (status === 'missed') return 'Missed';
    if (status === 'rejected') return 'Rejected';
    return direction === 'incoming' ? 'Incoming' : 'Outgoing';
  };

  const handleCallBack = async (number: string, contactId?: string) => {
    tap();
    try {
      const result = await phoneService.makeCall(number, contactId);
      setActiveCall(result.activeCall);
      setTab('active');
    } catch {
      toast('Call failed', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  if (error) {
    return <EmptyState icon="🕐" title="Unable to Load" description="Failed to load call history." />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-4 overflow-x-auto" role="tablist" aria-label="Call history filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => { tap(); setFilter(f.id); }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap min-h-[36px] ${filter === f.id ? 'bg-banana-gold/20 text-banana-gold border border-banana-gold/30' : 'bg-white/5 text-white/50 border border-white/10'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {items.length === 0 ? (
          <EmptyState icon="🕐" title="No Calls Yet" description="Your recent calls will appear here." />
        ) : (
          items.map((entry) => (
            <GlassCard key={entry.id} onClick={() => handleCallBack(entry.remoteNumber, entry.contactId)}>
              <div className="flex items-center gap-3 min-h-[44px]">
                <CallerAvatar name={entry.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.status === 'missed' ? 'text-red-300' : 'text-white'}`}>
                    {entry.displayName}
                  </p>
                  <p className="text-white/40 text-[10px]">
                    {new Date(entry.endedAt).toLocaleString()} • {entry.durationSeconds > 0 ? `${entry.durationSeconds}s` : '—'}
                  </p>
                </div>
                <span className="text-[10px] text-white/40" aria-label={statusLabel(entry.status, entry.direction)}>
                  {statusLabel(entry.status, entry.direction)}
                </span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
