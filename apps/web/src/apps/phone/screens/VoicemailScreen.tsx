'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/stores/toastStore';
import { queueIfOffline } from '../hooks/usePhoneOffline';

export function VoicemailScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'voicemail'],
    queryFn: () => phoneService.getVoicemails(),
  });
  const queryClient = useQueryClient();
  const { tap } = useHaptic();
  const online = useOnlineStatus();

  const handleRead = async (id: string) => {
    tap();
    if (queueIfOffline(online, 'markVoicemailRead', { id })) return;
    try {
      await phoneService.markVoicemailRead(id);
      queryClient.invalidateQueries({ queryKey: ['phone', 'voicemail'] });
      toast('Marked as read', 'success');
    } catch {
      toast('Failed to mark as read', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    tap();
    if (queueIfOffline(online, 'deleteVoicemail', { id })) return;
    try {
      await phoneService.deleteVoicemail(id);
      queryClient.invalidateQueries({ queryKey: ['phone', 'voicemail'] });
      toast('Voicemail deleted', 'success');
    } catch {
      toast('Failed to delete voicemail', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} height="h-20" />;
  if (error) return <EmptyState icon="📬" title="Unable to Load" description="Failed to load voicemail. Try again when online." />;

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {data && data.unread > 0 && (
        <p className="text-banana-gold text-xs px-1" role="status">{data.unread} unread message{data.unread > 1 ? 's' : ''}</p>
      )}
      {items.length === 0 ? (
        <EmptyState icon="📬" title="No Voicemails" description="Messages left when you miss a call will appear here." />
      ) : (
        items.map((vm) => (
          <GlassCard key={vm.id} onClick={() => !vm.isRead && handleRead(vm.id)} className={!vm.isRead ? 'border-banana-gold/30' : ''}>
            <div className="flex items-start gap-3">
              <CallerAvatar name={vm.fromName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{vm.fromName}</p>
                  {!vm.isRead && <span className="w-2 h-2 rounded-full bg-banana-gold" aria-label="Unread" />}
                </div>
                <p className="text-white/40 text-[10px]">{vm.fromNumber} • {new Date(vm.receivedAt).toLocaleString()}</p>
                {vm.transcript && <p className="text-white/60 text-xs mt-2 line-clamp-2">{vm.transcript}</p>}
                <p className="text-white/30 text-[10px] mt-1">{vm.durationSeconds}s</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(vm.id); }}
                className="text-white/30 text-xs min-h-[44px] px-2"
                aria-label={`Delete voicemail from ${vm.fromName}`}
              >
                Delete
              </button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
