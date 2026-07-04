'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/stores/toastStore';
import { queueIfOffline } from '../hooks/usePhoneOffline';

export function FavoritesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'favorites'],
    queryFn: () => phoneService.getFavorites(),
  });
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const queryClient = useQueryClient();
  const { tap } = useHaptic();
  const online = useOnlineStatus();

  const handleCall = async (phoneNumber: string, contactId?: string) => {
    tap();
    try {
      const result = await phoneService.makeCall(phoneNumber, contactId);
      setActiveCall(result.activeCall);
      setTab('active');
    } catch {
      toast('Call failed', 'error');
    }
  };

  const handleRemove = async (id: string) => {
    tap();
    if (queueIfOffline(online, 'removeFavorite', { id })) return;
    try {
      await phoneService.removeFavorite(id);
      queryClient.invalidateQueries({ queryKey: ['phone', 'favorites'] });
      toast('Removed from favorites', 'success');
    } catch {
      toast('Failed to remove favorite', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={3} />;
  if (error) return <EmptyState icon="⭐" title="Unable to Load" description="Failed to load favorites." />;

  const favorites = data ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {favorites.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No Favorites Yet"
          description="Add speed-dial contacts from the Contacts picker."
        />
      ) : (
        favorites.map((fav) => (
          <GlassCard key={fav.id}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCall(fav.phoneNumber, fav.contactId)}
                className="flex items-center gap-3 flex-1 text-left min-h-[44px]"
                aria-label={`Call ${fav.label}`}
              >
                <CallerAvatar name={fav.label} avatar={fav.avatar} size="sm" />
                <div>
                  <p className="text-white text-sm font-medium">{fav.label}</p>
                  <p className="text-white/40 text-[10px]">{fav.phoneNumber}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRemove(fav.id)}
                className="text-white/30 text-xs px-2 min-h-[44px]"
                aria-label={`Remove ${fav.label} from favorites`}
              >
                Remove
              </button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
