'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { GlassCard } from '../components/GlassCard';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';

export function VoicemailScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'voicemail'],
    queryFn: () => phoneService.getVoicemails(),
  });
  const queryClient = useQueryClient();
  const { tap } = useHaptic();

  const handleRead = async (id: string) => {
    tap();
    await phoneService.markVoicemailRead(id);
    queryClient.invalidateQueries({ queryKey: ['phone', 'voicemail'] });
  };

  const handleDelete = async (id: string) => {
    tap();
    await phoneService.deleteVoicemail(id);
    queryClient.invalidateQueries({ queryKey: ['phone', 'voicemail'] });
  };

  if (isLoading) return <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>;
  if (error) return <div className="p-6 text-center text-white/50 text-sm">Failed to load voicemail</div>;

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {data && data.unread > 0 && (
        <p className="text-green-400 text-xs px-1">{data.unread} unread message{data.unread > 1 ? 's' : ''}</p>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          <p className="text-4xl mb-3">📬</p>
          <p>No voicemails</p>
        </div>
      ) : (
        items.map((vm) => (
          <GlassCard key={vm.id} onClick={() => !vm.isRead && handleRead(vm.id)} className={!vm.isRead ? 'border-green-400/30' : ''}>
            <div className="flex items-start gap-3">
              <CallerAvatar name={vm.fromName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{vm.fromName}</p>
                  {!vm.isRead && <span className="w-2 h-2 rounded-full bg-green-400" />}
                </div>
                <p className="text-white/40 text-[10px]">{vm.fromNumber} • {new Date(vm.receivedAt).toLocaleString()}</p>
                {vm.transcript && <p className="text-white/60 text-xs mt-2 line-clamp-2">{vm.transcript}</p>}
                <p className="text-white/30 text-[10px] mt-1">{vm.durationSeconds}s</p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(vm.id); }} className="text-white/30 text-xs">Delete</button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
