'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard } from '../components/GlassCard';
import { CallerAvatar } from '../components/CallerAvatar';
import { useHaptic } from '@/hooks/useSound';

export function FavoritesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['phone', 'favorites'],
    queryFn: () => phoneService.getFavorites(),
  });
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const queryClient = useQueryClient();
  const { tap } = useHaptic();

  const handleCall = async (phoneNumber: string, contactId?: string) => {
    tap();
    const result = await phoneService.makeCall(phoneNumber, contactId);
    setActiveCall(result.activeCall);
    setTab('active');
  };

  const handleRemove = async (id: string) => {
    tap();
    await phoneService.removeFavorite(id);
    queryClient.invalidateQueries({ queryKey: ['phone', 'favorites'] });
  };

  if (isLoading) return <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}</div>;
  if (error) return <div className="p-6 text-center text-white/50 text-sm">Failed to load favorites</div>;

  const favorites = data ?? [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {favorites.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          <p className="text-4xl mb-3">⭐</p>
          <p>No favorites yet</p>
          <p className="text-xs mt-1">Add speed dial contacts from Contacts Picker</p>
        </div>
      ) : (
        favorites.map((fav) => (
          <GlassCard key={fav.id}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => handleCall(fav.phoneNumber, fav.contactId)} className="flex items-center gap-3 flex-1 text-left">
                <CallerAvatar name={fav.label} avatar={fav.avatar} size="sm" />
                <div>
                  <p className="text-white text-sm font-medium">{fav.label}</p>
                  <p className="text-white/40 text-[10px]">{fav.phoneNumber}</p>
                </div>
              </button>
              <button type="button" onClick={() => handleRemove(fav.id)} className="text-white/30 text-xs px-2">Remove</button>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}
