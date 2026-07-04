'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard } from '../components/GlassCard';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';

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

  const statusIcon = (status: string, direction: string) => {
    if (status === 'missed') return '📵';
    if (status === 'rejected') return '✕';
    return direction === 'incoming' ? '↙️' : '↗️';
  };

  const handleCallBack = async (number: string, contactId?: string) => {
    tap();
    const result = await phoneService.makeCall(number, contactId);
    setActiveCall(result.activeCall);
    setTab('active');
  };

  if (isLoading) {
    return <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-white/50 text-sm">Failed to load call history</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => { tap(); setFilter(f.id); }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filter === f.id ? 'bg-green-400/20 text-green-400 border border-green-400/30' : 'bg-white/5 text-white/50 border border-white/10'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">No calls yet</div>
        ) : (
          items.map((entry) => (
            <GlassCard key={entry.id} onClick={() => handleCallBack(entry.remoteNumber, entry.contactId)}>
              <div className="flex items-center gap-3">
                <CallerAvatar name={entry.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.status === 'missed' ? 'text-red-300' : 'text-white'}`}>
                    {entry.displayName}
                  </p>
                  <p className="text-white/40 text-[10px]">
                    {new Date(entry.endedAt).toLocaleString()} • {entry.durationSeconds > 0 ? `${entry.durationSeconds}s` : '—'}
                  </p>
                </div>
                <span className="text-lg">{statusIcon(entry.status, entry.direction)}</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
