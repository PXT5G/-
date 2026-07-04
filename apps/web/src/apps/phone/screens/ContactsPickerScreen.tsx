'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { contactsApi } from '@/services/contactsApi';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard, LoadingSkeleton } from '@/components/shared';
import { EmptyState } from '@/components/shared/EmptyState';
import { CallerAvatar } from '../components/CallerAvatar';
import { PhoneIcon, StarIcon } from '@/components/shared/PhoneIcons';
import { useHaptic } from '@/hooks/useSound';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from '@/stores/toastStore';
import { queueIfOffline } from '../hooks/usePhoneOffline';

const APP_ID = 'com.bananaos.phone';

export function ContactsPickerScreen() {
  const [query, setQuery] = useState('');
  const setTab = usePhoneStore((s) => s.setTab);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const queryClient = useQueryClient();
  const { tap } = useHaptic();
  const online = useOnlineStatus();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['phone', 'contacts', query],
    queryFn: async () => {
      if (query.trim()) return phoneService.searchContacts(query);
      const favorites = await contactsApi.getFavorites(APP_ID);
      return (favorites as Array<{ id: string; fullName: string; primaryPhone?: string; avatar?: string }>).map((c) => ({
        id: c.id,
        fullName: c.fullName,
        primaryPhone: c.primaryPhone,
        avatar: c.avatar,
      }));
    },
    enabled: true,
  });

  const handleCall = async (phone: string, contactId: string) => {
    tap();
    try {
      const result = await phoneService.makeCall(phone, contactId);
      setActiveCall(result.activeCall);
      setTab('active');
    } catch {
      toast('Call failed', 'error');
    }
  };

  const handleAddFavorite = async (phone: string, contactId: string, name: string) => {
    tap();
    const payload = { phoneNumber: phone, label: name, contactId };
    if (queueIfOffline(online, 'addFavorite', payload)) return;
    try {
      await phoneService.addFavorite(payload);
      queryClient.invalidateQueries({ queryKey: ['phone', 'favorites'] });
      toast('Added to favorites', 'success');
    } catch {
      toast('Failed to add favorite', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          aria-label="Search contacts"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-banana-gold/40 min-h-[44px]"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : (contacts ?? []).length === 0 ? (
          <EmptyState icon="👤" title="No Contacts Found" description="Try a different search or add contacts in the Contacts app." />
        ) : (
          (contacts ?? []).map((c) => {
            const phone = 'phoneNumbers' in c ? (c.primaryPhone ?? c.phoneNumbers?.[0]?.number) : c.primaryPhone;
            if (!phone) return null;
            return (
              <GlassCard key={c.id}>
                <div className="flex items-center gap-3">
                  <CallerAvatar name={c.fullName} avatar={c.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.fullName}</p>
                    <p className="text-white/40 text-[10px]">{phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCall(phone, c.id)}
                      aria-label={`Call ${c.fullName}`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-banana-gold/20 text-banana-gold flex items-center justify-center"
                    >
                      <PhoneIcon className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFavorite(phone, c.id, c.fullName)}
                      aria-label={`Add ${c.fullName} to favorites`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/5 text-banana-gold flex items-center justify-center"
                    >
                      <StarIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
